from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

# Nama model yang sudah diupload ke Hugging Face
MODEL_NAME = "my-username/indo-formalizer"  # ganti dengan HF repo kamu

app = FastAPI()

print("Loading model...")

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
model.eval()

print("Model loaded successfully!")

class PredictionRequest(BaseModel):
    text: str

@app.post("/api/predict")
def predict(req: PredictionRequest):
    # Tokenize input
    inputs = tokenizer(req.text, return_tensors="pt", truncation=True, max_length=512)

    # Generate output
    with torch.no_grad():
        generated_ids = model.generate(
            **inputs,
            max_new_tokens=128,
            num_beams=4,
        )

    # Decode output
    result = tokenizer.decode(generated_ids[0], skip_special_tokens=True)
    return {"output": result}
