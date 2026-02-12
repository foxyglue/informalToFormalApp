import { useEffect, useState } from "react";

interface PredictionResponse {
    input: string;
    output: string;
}

interface HealthResponse {
    status: string;
    model_loaded: boolean;
    tokenizer_loaded: boolean;
}

function App() {
    const [inputText, setInputText] = useState("");
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [backendReady, setBackendReady] = useState(false);
    const [checkingBackend, setCheckingBackend] = useState(true);

    // Check backend health on mount
    useEffect(() => {
        const checkHealth = async () => {
            try {
                const response = await fetch("/api/health");
                const data: HealthResponse = await response.json();

                if (data.status === "healthy" && data.model_loaded) {
                    setBackendReady(true);
                    setCheckingBackend(false);
                } else {
                    // Keep checking every 5 seconds
                    setTimeout(checkHealth, 5000);
                }
            } catch (err) {
                console.error("Health check failed:", err);
                setTimeout(checkHealth, 5000);
            }
        };

        checkHealth();
    }, []);

    const handleSubmit = async () => {
        if (!inputText.trim()) {
            setError("Masukkan teks terlebih dahulu");
            return;
        }

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
                const errorData = await res.json();
                throw new Error(errorData.detail || "Server error");
            }

            const data: PredictionResponse = await res.json();
            setResult(data.output);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Terjadi kesalahan 😕");
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setInputText("");
        setResult("");
        setError("");
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(result);
            alert("Disalin ke clipboard! ✅");
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const exampleTexts = [
        "gw udh coba berkali2 tp tetep gabisa min",
        "knp pas mau login kaya gini terus ya?",
        "tolong dibantu dong udh transfer tp blm masuk2",
    ];

    const handleExampleClick = (text: string) => {
        setInputText(text);
        setResult("");
        setError("");
    };

    // Loading screen while backend initializes
    if (checkingBackend) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center text-white max-w-md">
                    <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
                    <h2 className="text-2xl font-bold mb-3">
                        Memuat Model...
                    </h2>
                    <p className="text-white/90 mb-2">
                        Biasanya memakan waktu 1-2 menit saat pertama kali
                    </p>
                    <p className="text-sm text-white/70 mt-4">
                        💡 Model akan tetap dimuat untuk semua pengguna!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-3">
                        🇮🇩 Indonesian Formality Transfer
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Ubah teks informal menjadi formal dengan AI
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
                    {/* Input Section */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Teks Informal
                        </label>
                        <textarea
                            placeholder="Contoh: gw udh coba tp gabisa..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            className="w-full h-32 p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                            disabled={loading || !backendReady}
                        />
                    </div>

                    {/* Examples */}
                    <div>
                        <p className="text-sm text-gray-600 mb-2">
                            Coba contoh:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {exampleTexts.map((text, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleExampleClick(text)}
                                    disabled={loading}
                                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {text}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !inputText.trim() || !backendReady}
                            className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Memproses...</span>
                                </>
                            ) : (
                                <>
                                    <span>✨</span>
                                    <span>Formalisasi</span>
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleClear}
                            disabled={loading}
                            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Hapus
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-red-600 text-sm font-medium">
                                ⚠️ {error}
                            </p>
                        </div>
                    )}

                    {/* Result */}
                    {result && (
                        <div className="space-y-3">
                            <label className="block text-sm font-semibold text-gray-700">
                                Teks Formal
                            </label>
                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border-2 border-indigo-100">
                                <p className="text-gray-800 text-lg leading-relaxed">
                                    {result}
                                </p>
                            </div>
                            <button
                                onClick={handleCopy}
                                className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <span>📋</span>
                                <span>Salin ke Clipboard</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center mt-8 text-gray-600 text-sm">
                    <p>
                        Powered by{" "}
                        <a
                            href="https://huggingface.co/foxyglue/cendol-mt5-base-inst-indonesian-formality"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-700 font-semibold underline"
                        >
                            cendol-mt5-base-inst
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default App;
