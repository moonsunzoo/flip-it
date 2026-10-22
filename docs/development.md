# 개발 환경

## 클라우드

기존 체크아웃 `/workspace/flip-it`을 사용한다. 각 클라우드 작업은 이미 격리되어 있으므로 사용자가 요청하지 않는 한 별도 Git worktree를 만들지 않는다.

필수: Node.js 24, npm, `registry.npmjs.org` 접근. 비밀값·외부 API·DB는 현재 학생 앱에 필요하지 않다.

```sh
cd /workspace/flip-it
export npm_config_cache=/workspace/.cache/npm
npm ci
npm run check
```

클라우드의 기본 홈 디렉터리에는 쓰기 제한이 있으므로 npm 캐시를 `/workspace/.cache/npm`으로 지정한다. 패키지 checksum과 TLS 검증은 유지한다.

## 실행

```sh
cd /workspace/flip-it
npm run dev
```

5173 포트에서 개발 서버가 시작된다. 준비 상태는 로컬 HTTP 요청으로 HTML과 `/src/main.tsx`의 성공 응답을 확인하고, 학습 흐름은 브라우저 테스트로 확인한다. 온보딩 화면에는 localhost 미리보기 링크를 만들지 않는다.

실행 프로세스는 새 작업이나 환경 재시작 때 유지된다고 가정하지 않는다. 파일과 설치 의존성은 스냅샷 대상이지만, 개발 서버는 필요할 때 다시 시작한다. 이미 포트를 쓰는 프로세스가 있으면 먼저 확인하고 이 작업이 시작한 서버만 종료한다.

## 브라우저 검사

```sh
cd /workspace/flip-it
npm run build
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

Playwright는 4173 포트의 프로덕션 미리보기 서버를 자동 실행한다. CI에서는 기존 서버를 재사용하지 않는다. 검사 동시성은 2개이며 데스크톱과 360×800 화면을 각각 검사한다. Chromium 경로 환경 변수를 생략하면 Playwright가 설치한 브라우저를 사용한다.

로그·trace·테스트 결과는 `test-results/`에 생성되며 Git에서 제외한다. PRD 원본은 formatter에서 제외해 첨부 파일 내용이 보존되도록 한다.

## 환경 설정 저장

환경 설정 도구가 제공되는 경우 설치 절차는 `install_script`, 기존 체크아웃과 서버 시작·검증 절차는 `start_skill`에 저장한다. 설정 초안 저장은 실행이나 게시를 수행하지 않는다. 게시와 새 작업에서의 복원 검증은 별도 단계다.

2026-10-22 인계 복원 환경에는 설정을 저장·게시하는 도구가 제공되지 않아 이 문서의 명령으로 직접 설치·검증했다. 개발 서버는 다음 명령으로 시작하며 5173 포트 충돌 시 다른 서버를 종료하지 않고 실패한다.

```sh
npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

Pages 경로 검증은 build와 E2E의 경로를 일치시킨다.

```sh
npm run format:check
VITE_BASE_PATH=/flip-it/ npm run check
CI=true VITE_BASE_PATH=/flip-it/ PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

GitHub 연결 도구에서 `moonsunzoo`를 선택할 수 있다는 사실이 실행 환경의 Git 인증도 같은 계정임을 보장하지 않는다. 원격 쓰기 전에 실제 Git/CLI 인증과 저장소 push 권한을 확인한다. 현재 확인된 불일치와 후속 배포 조건은 [구현 현황](implementation-status.md#복원-및-배포-상태)에 기록한다. 기존 두 계정을 유지하고 별도 PAT를 등록하지 않는다. API 조회·Pages 설정에는 `api.github.com`, 게시 사이트 확인에는 `moonsunzoo.github.io`의 환경 네트워크 허용이 필요하다.
