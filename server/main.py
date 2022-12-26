import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import dotenv_values
from supabase import create_client
from transformers import AutoTokenizer, AutoModel
import torch

env = dotenv_values()
supabase = create_client(env["SUPABASE_URL"], env["SUPABASE_ANON_KEY"])
tokenizer = AutoTokenizer.from_pretrained(
    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
)
model = AutoModel.from_pretrained(
    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
)

# Helpers

# Mean Pooling - Take attention mask into account for correct averaging
def mean_pooling(model_output, attention_mask):
    token_embeddings = model_output[
        0
    ]  # First element of model_output contains all token embeddings
    input_mask_expanded = (
        attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
    )
    return torch.sum(token_embeddings * input_mask_expanded, 1) / torch.clamp(
        input_mask_expanded.sum(1), min=1e-9
    )


def generate_embeddings(paragraphs):
    encoded_input = tokenizer(
        paragraphs, padding=True, truncation=True, return_tensors="pt"
    )
    with torch.no_grad():
        model_output = model(**encoded_input)
    sentence_embeddings = mean_pooling(model_output, encoded_input["attention_mask"])
    return sentence_embeddings


# Setup the book embeddings
books = []

for book in supabase.table("Books").select("*").execute().data:
    book_contents = (
        supabase.table("book contents")
        .select("*")
        .eq("book_id", book["id"])
        .execute()
        .data
    )
    if len(book_contents) == 0:
        continue
    book_content = book_contents[0]

    embedding = (
        supabase.table("Embeddings")
        .select("*")
        .eq("book_id", book["id"])
        .execute()
        .data
    )
    if len(embedding) == 0:
        title = book_content["content"]["title"]
        print("Generating embedding for", title)
        paragraphs = book_content["content"]["paragraphs"]
        chunks = [paragraphs[i : i + 100] for i in range(0, len(paragraphs), 100)]
        embeddings = torch.zeros((0, 384))
        for chunk in chunks:
            chunk_embedding = generate_embeddings(chunk)
            embeddings = torch.cat((embeddings, chunk_embedding))
        supabase.table("Embeddings").insert(
            {
                "book_id": book["id"],
                "embeddings": embeddings.tolist(),
                "book_content_id": book_content["id"],
            }
        ).execute()
        continue

# SECTION API

app = FastAPI()

# TODO: Add CORS as an environement variable
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Search(BaseModel):
    query: str


@app.post("/search/")
def search(search: Search):
    # TODO implement this
    return response


class GenerateEmbedding(BaseModel):
    book_id: str


# TODO implement this
@app.post("/generate-embedding/")
def generate_embedding(generate_embedding: GenerateEmbedding):
    book_id = generate_embedding.book_id
    response = {"results": generate_book_embeddings(book_id, books), "book_id": book_id}
    return response


if __name__ == "__main__":
    uvicorn.run("main:app", port=int(env["MODEL_PORT"]))
