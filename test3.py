from tesserocr import PyTessBaseAPI

images = ['./image.png']

with PyTessBaseAPI(path='./tessdata') as api:
  for img in images:
    api.SetImageFile(img)
    for word, conf in zip(api.GetUTF8Text().split(), api.AllWordConfidences()):
      print(f"word: {word}, conf: {conf}")

    print(api.GetUTF8Text())
    print(api.GetAllWordConfidences())
