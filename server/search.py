import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModel
import json
import torch
import os
from dotenv import dotenv_values
from supabase import create_client

env = dotenv_values()
supabase = create_client(env["SUPABASE_URL"], env["SUPABASE_KEY"])

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


tokenizer = AutoTokenizer.from_pretrained(
    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
)
model = AutoModel.from_pretrained(
    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
)


def generate_embeddings(paragraphs):
    encoded_input = tokenizer(
        paragraphs, padding=True, truncation=True, return_tensors="pt"
    )
    with torch.no_grad():
        model_output = model(**encoded_input)
    sentence_embeddings = mean_pooling(model_output, encoded_input["attention_mask"])
    return sentence_embeddings


def get_book_embeddings(book_id, content):
    file_name = f"books/embeddings_{book_id}.pt"
    embeddings = torch.zeros((0, 384))
    if os.path.exists(file_name):
        return torch.load(file_name)
    else:
        print("Generating embeddings for book", book_id)
        chunks = [content[i : i + 100] for i in range(0, len(content), 100)]
        for chunk in chunks:
            chunk_embeddings = generate_embeddings(chunk)
            embeddings = torch.cat((embeddings, chunk_embeddings))
        torch.save(embeddings, file_name)
        return embeddings


books = []


def load_book(book_id):
    with open(f"books/{book_id}.json", "r") as f:
        book = json.load(f)
    embeddings = get_book_embeddings(book_id, book["content"])
    book["embeddings"] = embeddings
    books.append(book)


def stretch_embeddings(embeddings, length):
    new_embed = torch.zeros((length, embeddings.shape[1]))
    new_embed[: embeddings.shape[0], :] = embeddings
    return new_embed


def search_books(query, books):
    query_embeddings = generate_embeddings([query])
    # The embeddings should stretch to fit any book
    books_embedding = torch.stack(
        [stretch_embeddings(book["embeddings"], 8000) for book in books]
    )
    book_length = books_embedding.shape[1]
    distances = torch.nn.functional.cosine_similarity(
        query_embeddings, books_embedding, dim=2
    )
    top_distances = torch.topk(torch.flatten(distances), k=10).indices
    results = []
    for i in top_distances:
        book_index = i // book_length
        book = books[book_index]
        content = books[book_index]["content"][i % book_length]
        results.append(
            dict(
                book=book["id"],
                content=content,
                title=book["title"],
                shortTitle=book["shortTitle"],
                link=book["link"],
                authors=book["authors"],
            )
        )

    return results


dir_list = os.listdir("books")
for file in dir_list:
    if file.endswith(".json"):
        load_book(file.split(".")[0])
