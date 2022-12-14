import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModel
import torch
import os
from dotenv import dotenv_values
env = dotenv_values()

#Mean Pooling - Take attention mask into account for correct averaging
def mean_pooling(model_output, attention_mask):
    token_embeddings = model_output[0] #First element of model_output contains all token embeddings
    input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
    return torch.sum(token_embeddings * input_mask_expanded, 1) / torch.clamp(input_mask_expanded.sum(1), min=1e-9)

tokenizer = AutoTokenizer.from_pretrained('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
model = AutoModel.from_pretrained('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')

def generate_embeddings(paragraphs):
  encoded_input = tokenizer(paragraphs, padding=True, truncation=True, return_tensors='pt')
  with torch.no_grad():
    model_output = model(**encoded_input)
  sentence_embeddings = mean_pooling(model_output, encoded_input['attention_mask'])
  return sentence_embeddings

def load_book(path):
  with open(path, 'r') as f:
    return f.read().strip()

def parse_book(book):
  return [line.strip().replace('\n', ' ') for line in book.split('\n\n') if line.strip()]

def get_book_embeddings(book_id, content):
  file_name = f'books/embeddings_{book_id}.pt'
  embeddings = torch.zeros((0, 384))
  if os.path.exists(file_name):
    return torch.load(file_name)
  else:
    print("Generating embeddings for book", book_id)
    chunks = [content[i:i+100] for i in range(0, len(content), 100)]
    for chunk in chunks:
      chunk_embeddings = generate_embeddings(chunk)
      embeddings = torch.cat((embeddings, chunk_embeddings))
    torch.save(embeddings, file_name)
    return embeddings

books = []
def load_book(book_id):
  with open(f'books/{book_id}.txt', 'r') as f:
    content = parse_book(f.read().strip())
  embeddings = get_book_embeddings(book_id, content)
  book = dict(id=book_id, content=content, embeddings=embeddings)
  books.append(book)

def search_books(query, books):
  query_embeddings = generate_embeddings([query])
  # The embeddings should stretch to fit any book
  books_embedding = torch.stack([book['embeddings'] for book in books])
  book_length = books_embedding.shape[1]
  distances = torch.nn.functional.cosine_similarity(query_embeddings, books_embedding, dim=2)
  top_distances = torch.topk(torch.flatten(distances), k=10).indices
  return [books[i // book_length]["content"][i % book_length] for i in top_distances]

load_book('2701')
app = FastAPI()

origins = [
    "http://localhost",
    f"http://localhost:{env['MODEL_PORT']}",
    f"http://localhost:{env['CLIENT_PORT']}"
]

print(origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"Hello": "World"}
  
class Search(BaseModel):
  query: str

@app.post("/search/")
def search(search: Search):
  query = search.query 
  response = {
    "results": search_books(query, books),
    "query": query
  }
  return response

if __name__ == "__main__":
    uvicorn.run("main:app", port=int(env['MODEL_PORT']))
  