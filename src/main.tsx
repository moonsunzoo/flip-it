import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { parseCatalog } from './lib/content';
import rawCatalog from './content/catalog.json';
import './styles.css';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="fatal-error">
        <h1>학습 화면을 불러오지 못했어요.</h1>
        <p>잠시 후 다시 시도해 주세요. 저장된 학습 기록은 삭제하지 않았습니다.</p>
        <button className="button primary" onClick={() => window.location.reload()}>
          다시 불러오기
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
function ValidatedApp() {
  return <App catalog={parseCatalog(rawCatalog)} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ValidatedApp />
    </ErrorBoundary>
  </React.StrictMode>,
);
