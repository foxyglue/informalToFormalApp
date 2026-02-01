import { useState } from "react";

function App() {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    setError("");
    setResult("");

    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (!res.ok) {
        throw new Error("Server error");
      }

      const data = await res.json();
      setResult(data.output);
    } catch (err: any) {
      console.error(err);
      setError("Terjadi kesalahan 😕");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">
        Informal → Formal Indonesian
      </h1>

      <textarea
        placeholder="Masukkan text informal..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        className="w-full h-32 p-3 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-2 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? "Memproses..." : "Convert"}
      </button>

      {error && (
        <p className="text-red-500 text-center">{error}</p>
      )}

      {result && (
        <div className="bg-gray-100 p-4 rounded border border-gray-200">
          <h2 className="font-semibold">Hasil:</h2>
          <p className="mt-2 text-gray-800">{result}</p>
        </div>
      )}
    </div>
  );
}

export default App;
