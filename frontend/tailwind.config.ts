import type { Config } from "tailwindcss";

const config: Config = {
    // Đảm bảo đường dẫn này khớp với cấu trúc thư mục của bạn
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/**/*.{js,ts,jsx,tsx,mdx}", // Thêm dòng này nếu bạn dùng thư mục src
    ],
    theme: {
        extend: {
            keyframes: {
                'sensor-pulse': {
                    '0%': {
                        transform: 'scale(1)',
                        opacity: '0.8'
                    },
                    '20%': {
                        opacity: '1'
                    },
                    '100%': {
                        transform: 'scale(15)',
                        opacity: '0'
                    },
                },
                'sensor-pop': {
                    '0%': { transform: 'scale(0.5)', opacity: '0' },
                    '20%': { transform: 'scale(1)', opacity: '1' },
                    '100%': { transform: 'scale(1.5)', opacity: '0' },
                },
            },
            animation: {
                // Tên class sẽ là 'animate-sensor-pulse'
                'sensor-pulse': 'sensor-pulse 1s ease-out forwards',
                'sensor-pop': 'sensor-pop 0.8s ease-out forwards',
            },
        },
    },
    plugins: [],
};
export default config;