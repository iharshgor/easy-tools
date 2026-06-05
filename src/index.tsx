import { createRoot } from 'react-dom/client';
import 'tailwindcss/tailwind.css';
import App from 'components/App';

// Initialize Google Analytics if Measurement ID is provided
const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
if (gaId) {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);

  const scriptInit = document.createElement('script');
  scriptInit.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${gaId}', { page_path: window.location.pathname });
  `;
  document.head.appendChild(scriptInit);
}

const container = document.getElementById('root') as HTMLDivElement;
const root = createRoot(container);

root.render(<App />);
