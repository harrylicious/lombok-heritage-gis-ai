import { pipeline, env } from "@huggingface/transformers";

// Configure transformers.js to work fully in-browser (no server token needed)
env.allowLocalModels = false; // always fetch from the hub/CDN
env.useBrowserCache = true;   // cache in browser for faster re-runs

let classifierPromise: Promise<any> | null = null;

async function getClassifier() {
  if (!classifierPromise) {
    classifierPromise = pipeline(
      "image-classification",
      "onnx-community/mobilenetv4_conv_small.e2400_r224_in1k",
      { device: "webgpu" }
    );
  }
  return classifierPromise;
}

export async function classifyImage(file: File): Promise<{ label: string; score: number }[]> {
  const dataUrl = await fileToDataURL(file);
  const classifier: any = await getClassifier();
  const result = await classifier(dataUrl);
  if (!Array.isArray(result)) return [];
  return result.map((r: any) => ({ label: r.label, score: r.score }));
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
