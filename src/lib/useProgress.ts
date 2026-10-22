import { useEffect, useRef, useState } from 'react';
import { emptyProgress, loadProgress, saveProgress, type Progress } from './storage';

function readInitial() {
  try {
    return loadProgress(window.localStorage);
  } catch {
    return {
      progress: emptyProgress(),
      blocked: false,
      error: '브라우저 저장소를 사용할 수 없습니다. 새로고침하면 학습 기록이 사라질 수 있습니다.',
    };
  }
}

export function useProgress() {
  const [initial] = useState(readInitial);
  const [progress, setProgress] = useState<Progress>(initial.progress);
  const [error, setError] = useState(initial.error);
  const [blocked, setBlocked] = useState(initial.blocked);
  const previous = useRef(initial.progress);
  useEffect(() => {
    if (blocked || previous.current === progress) return;
    previous.current = progress;
    try {
      setError(saveProgress(window.localStorage, progress));
    } catch {
      setError(
        '브라우저 저장소를 사용할 수 없습니다. 새로고침하면 이번 학습 기록이 사라질 수 있습니다.',
      );
    }
  }, [progress, blocked]);

  function resetStorage() {
    if (
      !window.confirm(
        '이 브라우저의 기존 학습 기록을 초기화할까요? 현재 화면에서 진행한 학습은 유지됩니다.',
      )
    )
      return;
    try {
      const failure = saveProgress(window.localStorage, progress);
      setError(failure);
      if (!failure) setBlocked(false);
    } catch {
      setError('브라우저 설정에서 사이트 저장소를 허용해 주세요.');
    }
  }
  return { progress, setProgress, error, blocked, resetStorage };
}
