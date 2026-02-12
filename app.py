from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch
from peft import PeftModel
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Nama model yang sudah diupload ke Hugging Face
MODEL_NAME = "foxyglue/cendol-mt5-base-inst-indonesian-formality" 
BASE_MODEL_NAME = "indonlp/cendol-mt5-base-inst"

app = FastAPI()

# CORS middleware - allow all origins for Hugging Face Spaces
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model and tokenizer
tokenizer = None
model = None

@app.on_event("startup")
async def load_model():
    """Load model on startup"""
    global tokenizer, model
    
    try:
        logger.info("Loading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        
        logger.info("Loading base model...")
        base_model = AutoModelForSeq2SeqLM.from_pretrained(
            BASE_MODEL_NAME,
            torch_dtype=torch.float32,
            low_cpu_mem_usage=True
        )
        
        logger.info("Loading PEFT adapter...")
        model = PeftModel.from_pretrained(base_model, MODEL_NAME)
        model.eval()
        
        logger.info("Model loaded successfully!")
        
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        raise

class PredictionRequest(BaseModel):
    text: str
    
    class Config:
        schema_extra = {
            "example": {
                "text": "gw udh coba berkali2 tp tetep gabisa min"
            }
        }

class PredictionResponse(BaseModel):
    input: str
    output: str

@app.get("/")
def read_root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "Indonesian Formality Transfer API is running",
        "model": MODEL_NAME
    }

@app.post("/api/predict", response_model=PredictionResponse)
async def predict(req: PredictionRequest):
    """
    Convert informal Indonesian text to formal Indonesian
    
    - **text**: Informal Indonesian text to be formalized
    """
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    try:
        # Inference prompt (without placeholder instruction)
        prompt = f"""Instruction: 
Anda akan diberikan sebuah kalimat Informal dalam bahasa Indonesia, dan tugas Anda adalah mengubahnya menjadi kalimat Formal dengan tetap menjaga makna asli. Perhatikan bahwa: 
- Output harus berupa satu kalimat utuh dalam bahasa Indonesia yang formal dan sesuai konteks
- Pastikan adanya huruf kapital pada awal kalimat dan setelah tanda titik (.), tanda seru (!) dan tanda tanya (?), serta nama orang, organisasi, gelar dan jabatan
- Perbaiki penggunaan tanda baca, seperti penambahan titik pada akhir kalimat dan tanda koma untuk anak kalimat
- Ubah kata yang tidak baku menjadi baku sesuai dengan KBBI, seperti kata yang disingkat (contoh: knp → kenapa) dan imbuhan (contoh: dia nulis resep → dia menulis resep)
- Perbaiki posisi kata dalam kalimat, seperti subjek diikuti dengan predikat dan objek serta keterangan jika ada (contoh: mesin ini rusak kenapa? → mengapa mesin ini rusak?)
- Jika ditemukan istilah asing, tambahkan "*" pada awal dan akhir kata (contoh: software → *software*)
- Hapus emoji dan hashtag bila ditemukan

Informal : {req.text}
Formal :"""
        
        # Tokenize input
        inputs = tokenizer(
            prompt, 
            return_tensors="pt", 
            truncation=True, 
            max_length=512
        )
        
        # Generate output
        with torch.no_grad():
            generated_ids = model.generate(
                **inputs,
                max_new_tokens=512,
                num_beams=4,
                do_sample=False,
                early_stopping=True
            )
        
        # Decode output
        result = tokenizer.decode(generated_ids[0], skip_special_tokens=True)
        
        # Extract only the formal part (after "Formal :")
        if "Formal :" in result:
            result = result.split("Formal :")[-1].strip()
        
        return PredictionResponse(
            input=req.text,
            output=result
        )
        
    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.get("/health")
def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "tokenizer_loaded": tokenizer is not None
    }
    
# SERVE FRONTEND STATIC FILES IN HUGFACE SPACES
frontend_path = Path("/app/frontend_build")

if frontend_path.exists():
    app.mount("/assets", StaticFiles(directory="/app/frontend_build/assets"), name="assets")
    
    @app.get("/", response_class=FileResponse)
    async def serve_frontend():
        return FileResponse("/app/frontend_build/index.html")
    
    @app.get("/{full_path:path}", response_class=FileResponse)
    async def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        
        file_path = frontend_path / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        
        return FileResponse("/app/frontend_build/index.html")
else:
    logger.warning("Frontend build not found. Only API endpoints will be available.")