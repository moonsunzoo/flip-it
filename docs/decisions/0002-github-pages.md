# 0002. 학생 앱의 GitHub Pages 호스팅

- 상태: 사용자 선택 — 학생 정적 웹앱은 GitHub Pages 사용.
- 적용: 첫 개발 버전부터 Pages 경로와 자동 배포 워크플로를 준비한다.

## 구성

Vite가 만든 `dist/`를 공식 Pages Actions로 게시한다. `main` 푸시 또는 수동 실행 시 검증·빌드·브라우저 테스트가 성공한 산출물만 업로드하고 배포한다.

게시 후에는 배포 액션이 반환한 공개 URL을 대상으로 같은 데스크톱·모바일 E2E를 실행한다. 현재는 이전 버전의 기록 복원을 포함해 22개다. 이 검사는 별도 로컬 서버를 띄우지 않으며, 실제 사이트의 직접 진입·새로고침·이미지 경로·학습 복원을 확인한다. 게시가 성공해도 이 검사가 실패하면 전체 워크플로는 실패로 표시된다.

`actions/configure-pages`의 `base_path`로 `VITE_BASE_PATH`를 설정하므로 프로젝트 사이트의 `/flip-it/` 하위 경로와 사용자 지정 도메인의 루트 경로를 처리한다. UI 라우팅은 해시를 사용하여 직접 진입·새로고침 시 정적 서버의 404 라우팅 문제를 피한다. 로컬 SVG도 Vite base 경로를 따른다.

## 저장소에서 필요한 설정

1. 초기 코드를 원격 저장소에 푸시한다.
2. 저장소 `Settings → Pages → Build and deployment → Source`를 **GitHub Actions**로 지정한다.
3. `Deploy to GitHub Pages` 워크플로를 실행하거나 이후 `main`에 푸시한다.

워크플로 파일 작성은 GitHub 설정 변경이나 실제 배포 완료를 의미하지 않는다. 원격 실행 결과와 게시된 사이트는 배포 후 별도로 확인한다. 저장소 공개 여부와 계정 플랜에 따른 Pages 사용 가능 여부도 실제 활성화 시 확인한다.

## 기능 경계

학생 앱과 공개 콘텐츠는 Pages에서 제공할 수 있다. 학습 기록은 브라우저에 남는다. 교사 인증, 초안 보관, 이미지 공급원 비밀키, 공동 콘텐츠 편집 등은 별도 서버/API 또는 CMS에 둔다. 이를 학생용 JavaScript에 포함하지 않는다.

## 로컬 재현

```sh
VITE_BASE_PATH=/flip-it/ npm run build
VITE_BASE_PATH=/flip-it/ PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

일반 개발은 기본 경로 `/`를 사용한다. CI는 `/`와 `/flip-it/` 두 경로에서 동일한 수용 테스트를 실행한다.

이미 게시된 사이트는 다음과 같이 검사한다. 해당 주소에 네트워크 접근이 가능한 환경에서 실행해야 한다.

```sh
PLAYWRIGHT_BASE_URL=https://moonsunzoo.github.io/flip-it/ npm run test:e2e
```
