---
title: Indonesian Formality Transfer
emoji: 📝
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
---

# Indonesian Formality Transfer

Convert informal Indonesian text to formal Indonesian using fine-tuned mT5 model.

## API Endpoints

### POST /api/predict
Convert informal text to formal text

**Request Body:**
```json
{
  "text": "gw udh coba berkali2 tp tetep gabisa min"
}
```

**Response:**
```json
{
  "input": "gw udh coba berkali2 tp tetep gabisa min",
  "output": "Saya sudah mencoba berkali-kali tetapi tetap tidak bisa, Admin."
}
```

## Model

This model is based on [indonlp/cendol-mt5-base-inst](https://huggingface.co/indonlp/cendol-mt5-base-inst) and fine-tuned on the STIF-Indonesia dataset.