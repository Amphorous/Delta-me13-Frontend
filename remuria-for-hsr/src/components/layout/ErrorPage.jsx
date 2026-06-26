import { useState } from 'react';
import { useRouteError, useNavigate } from 'react-router';

function coloriseStackLine(line) {
    // Pattern: FunctionName@http://domain/path/File.jsx:line:col
    const match = line.match(/^(.+?)(@)(https?:\/\/[^/]+)(\/.*?\/([^/:]+))(:[\d:]+)?$/);
    if (match) {
        const [, fnName, at, domain, filePath, fileName, lineCol] = match;
        return (
            <>
                <span className="text-white font-bold">{fnName}</span>
                <span className="text-pink-400">{at}</span>
                <span className="text-emerald-400/70">{domain}</span>
                <span className="text-red-400/80">{filePath.slice(0, filePath.length - fileName.length)}</span>
                <span className="text-emerald-300">{fileName}</span>
                {lineCol && <span className="text-emerald-300">{lineCol}</span>}
            </>
        );
    }

    // "Status:" / "Message:" / "Data:" / "Stack trace:" labels
    const labelMatch = line.match(/^(Status|Message|Data|Stack trace)(:)(.*)/);
    if (labelMatch) {
        return (
            <>
                <span className="text-amber-300/80">{labelMatch[1]}</span>
                <span className="text-white/30">{labelMatch[2]}</span>
                <span className="text-white/60">{labelMatch[3]}</span>
            </>
        );
    }

    return <span className="text-white/50">{line}</span>;
}

function ColorisedError({ text }) {
    const lines = text.split('\n');
    return lines.map((line, i) => (
        <div key={i} className="leading-relaxed">
            {line === '' ? <br /> : coloriseStackLine(line)}
        </div>
    ));
}

function ErrorPage() {
    const error = useRouteError();
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);

    const errorText = [
        `Status: ${error?.status ?? 'unknown'}`,
        `Message: ${error?.statusText ?? error?.message ?? 'An unexpected error occurred'}`,
        error?.data ? `Data: ${typeof error.data === 'string' ? error.data : JSON.stringify(error.data, null, 2)}` : null,
        error?.stack ? `\nStack trace:\n${error.stack}` : null,
    ].filter(Boolean).join('\n');

    function copyError() {
        navigator.clipboard.writeText(errorText)
            .then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })
            .catch(() => {});
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-950 p-6">
            <div className="w-full max-w-3xl bg-gray-900/70 backdrop-blur-md border border-white/10 rounded-2xl px-8 py-8 flex flex-col gap-6">

                <div>
                    <p className="libre-baskerville-bold text-white text-3xl mb-1">
                        Something went wrong
                    </p>
                    <p className="afacad-light text-white/50 text-sm">
                        Re<span className="text-[var(--accent-colon)]">:</span>muria ran into an error it couldn't recover from.
                    </p>
                </div>

                {error?.status && (
                    <div className="flex items-baseline gap-3">
                        <span className="libre-baskerville-bold text-white/20 text-6xl leading-none select-none">
                            {error.status}
                        </span>
                        <span className="afacad-semi-bold text-white/50 text-lg">
                            {error.statusText ?? 'Error'}
                        </span>
                    </div>
                )}

                <div className="relative">
                    <div className="bg-black/40 border border-white/10 rounded-xl p-4 afacad-light text-xs overflow-auto max-h-72 select-text [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full">
                        <ColorisedError text={errorText} />
                    </div>
                    <button
                        onClick={copyError}
                        className={`absolute top-2 right-2 px-2.5 py-1 rounded-lg text-xs afacad-semi-bold transition-colors cursor-pointer ${copied ? 'bg-green-800/60 border border-green-500/30 text-green-200' : 'bg-white/10 border border-white/10 text-white/50 hover:bg-white/20 hover:text-white/70'}`}
                    >
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-5 py-2 rounded-xl afacad-semi-bold text-sm bg-white/10 border border-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
                    >
                        Go Back
                    </button>
                    <button
                        onClick={() => navigate('/home')}
                        className="px-5 py-2 rounded-xl afacad-semi-bold text-sm bg-[var(--accent-bg-40)] border border-[var(--accent-border-30)] text-white hover:bg-[var(--accent-bg-60)] transition-colors cursor-pointer"
                    >
                        Home
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-5 py-2 rounded-xl afacad-semi-bold text-sm bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white/70 transition-colors cursor-pointer ml-auto"
                    >
                        Reload Page
                    </button>
                </div>

            </div>
        </div>
    );
}

export default ErrorPage;
