import { Prism as ReactSyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function SyntaxHighlighter(props: { path: string; code: string }) {
    const lang = detectLanguageFromFilename(props.path);
    return (
        <ReactSyntaxHighlighter
            language={lang ?? 'javascript'}
            style={vscDarkPlus}
            showLineNumbers
            showInlineLineNumbers
            customStyle={{
                fontSize: '0.875rem',
                margin: 0,
                background: 'transparent',
            }}
            codeTagProps={{
                style: {
                    whiteSpace: 'pre',
                    overflowX: 'auto',
                },
            }}
        >
            {props.code}
        </ReactSyntaxHighlighter>
    );
}

function detectLanguageFromFilename(path: string): string {
    const pathParts = path.split('/');
    const extension = pathParts[pathParts.length - 1]
        ?.split('.')
        .pop()
        ?.toLowerCase();

    const extensionMap: Record<string, string> = {
        // JavaScript/TypeScript
        js: 'jsx',
        jsx: 'jsx',
        ts: 'typescript',
        tsx: 'tsx',
        mjs: 'javascript',
        cjs: 'javascript',

        // Python
        py: 'python',
        pyw: 'python',
        pyi: 'python',

        // Web technologies
        html: 'html',
        htm: 'html',
        css: 'css',
        scss: 'scss',
        sass: 'sass',
        less: 'less',

        // Other popular languages
        java: 'java',
        c: 'c',
        cpp: 'cpp',
        cxx: 'cpp',
        cc: 'cpp',
        h: 'c',
        hpp: 'cpp',
        cs: 'csharp',
        php: 'php',
        rb: 'ruby',
        go: 'go',
        rs: 'rust',
        swift: 'swift',
        kt: 'kotlin',
        scala: 'scala',
        sh: 'bash',
        bash: 'bash',
        zsh: 'bash',
        fish: 'bash',
        ps1: 'powershell',

        // Data formats
        json: 'json',
        xml: 'xml',
        yaml: 'yaml',
        yml: 'yaml',
        toml: 'toml',
        ini: 'ini',

        // Markup
        md: 'markdown',
        markdown: 'markdown',
        tex: 'latex',

        // Database
        sql: 'sql',

        // Config files
        dockerfile: 'dockerfile',
        gitignore: 'bash',
        env: 'bash',
    };

    return extensionMap[extension || ''] || 'text';
}
