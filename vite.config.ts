import path from "path"
import { defineConfig } from "vite"
import solid from "vite-plugin-solid"
import { viteSingleFile } from "vite-plugin-singlefile"

export default defineConfig({
    plugins: [solid(), viteSingleFile()],
    resolve: {
        alias: {
            "~": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        fs: {
            allow: [".."],
        },
    },
    optimizeDeps: {
        exclude: ["./src/pkg/euler_beam"],
    },
    build: {
        // WASM/ассеты в data URL — иначе vite-plugin-singlefile оставит отдельные файлы
        assetsInlineLimit: 100_000_000,
    },
})
