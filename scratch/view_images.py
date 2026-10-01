import google.generativeai as genai
import os

model = genai.GenerativeModel('gemini-1.5-pro')

def describe(img_path):
    print(f"\n--- {img_path} ---")
    try:
        f = genai.upload_file(img_path)
        r = model.generate_content([f, "What is in this screenshot? Tell me exactly what values are shown for Batch Yield, Est Batch Cost, Est Unit Cost, Suggested Price, Auto-Calculated Margin. And also any fields or columns."])
        print(r.text)
    except Exception as e:
        print(e)

base = "/home/bob2609/.gemini/antigravity-ide/brain/4fab2d1f-48d9-45f0-9357-3331d0b9af6f/.user_uploaded"
describe(f"{base}/media_1790867357290.png")
describe(f"{base}/media_1790867482212.png")
describe(f"{base}/media_1790867498454.png")
