import { i18n } from './i18n';
import { uiTranslations } from 'fumadocs-ui/i18n';
import { openapiTranslations } from 'fumadocs-openapi/i18n';

// PoC translations cover the exercised guide/search/read-only API controls.
// OAuth and other unused controls intentionally retain the English fallback.
const words: Record<string, [string, string]> = {
  'Search': ['문서 검색','ドキュメント検索'], 'Open Search': ['검색 열기','検索を開く'],
  'Close Search': ['검색 닫기','検索を閉じる'], 'No results found': ['검색 결과가 없습니다','検索結果がありません'],
  'Choose a language': ['언어 선택','言語を選択'], 'On this page': ['이 페이지의 내용','このページの内容'],
  'Table of Contents': ['목차','目次'], 'Next Page': ['다음 페이지','次のページ'], 'Previous Page': ['이전 페이지','前のページ'],
  'Copy Text': ['텍스트 복사','テキストをコピー'], 'Copied Text': ['복사됨','コピーしました'],
  'Copy Anchor Link': ['링크 복사','リンクをコピー'], 'Light': ['라이트','ライト'], 'Dark': ['다크','ダーク'], 'System': ['시스템','システム'],
  'Toggle Theme': ['화면 모드 전환','テーマを切り替え'], 'Open Sidebar': ['사이드바 열기','サイドバーを開く'],
  'Close Sidebar': ['사이드바 닫기','サイドバーを閉じる'], 'Collapse Sidebar': ['사이드바 접기','サイドバーを折りたたむ'],
  'Show Sidebar': ['사이드바 표시','サイドバーを表示'], 'Hide Sidebar': ['사이드바 숨기기','サイドバーを隠す'],
  'Open': ['열기','開く'], 'View as Markdown': ['마크다운 보기','Markdown を表示'], 'Copy Markdown': ['마크다운 복사','Markdown をコピー'],
  'Try in Playground': ['API 호출 실습','API リクエストを試す'], 'Send': ['요청 보내기','送信'],
  'Sending request...': ['요청 중...','送信中...'], 'Request': ['요청','リクエスト'], 'Response': ['응답','レスポンス'],
  'Query Parameters': ['쿼리 매개변수','クエリパラメーター'], 'Path Parameters': ['경로 매개변수','パスパラメーター'],
  'Header Parameters': ['헤더 매개변수','ヘッダーパラメーター'], 'Request Body': ['요청 본문','リクエストボディ'],
  'Response Body': ['응답 본문','レスポンスボディ'], 'Example Request': ['요청 예제','リクエスト例'],
  'Example Requests': ['요청 예제','リクエスト例'], 'Example Response': ['응답 예제','レスポンス例'],
  'Schema': ['스키마','スキーマ'], 'Properties': ['속성','プロパティ'], 'Type': ['유형','型'],
  'Default': ['기본값','既定値'], 'Example': ['예제','例'], 'Query': ['쿼리','クエリ'], 'Path': ['경로','パス'],
  'Header': ['헤더','ヘッダー'], 'Headers': ['헤더','ヘッダー'], 'Body': ['본문','ボディ'],
  'Server URL': ['서버 주소','サーバー URL'], 'Variables': ['변수','変数'], 'Enter Value': ['값 입력','値を入力'], 'Enter value': ['값 입력','値を入力'],
  'Not set': ['미설정','未設定'], 'Unset': ['설정 해제','設定解除'], 'Select': ['선택','選択'],
  'Close': ['닫기','閉じる'], 'Copy': ['복사','コピー'], 'Copied': ['복사됨','コピーしました'],
  'Download': ['다운로드','ダウンロード'], 'Clear': ['지우기','クリア'], 'Form': ['입력 폼','フォーム'], 'Editor': ['편집기','エディター'],
  'Authorization': ['인증','認証'], 'No example available.': ['예제가 없습니다.','例がありません。'],
  'This endpoint has no parameters.': ['매개변수가 없습니다.','パラメーターはありません。'],
  'Send a request to see its response.': ['요청을 보내면 응답이 표시됩니다.','リクエストを送信すると応答が表示されます。'],
  'Request Failed': ['요청 실패','リクエスト失敗'], 'Bad Request': ['잘못된 요청','不正なリクエスト'],
  'Too Many Requests': ['요청 한도 초과','リクエスト数の制限超過'], 'Not Found': ['찾을 수 없음','見つかりません'],
  'OK': ['성공','成功'], 'Successful': ['성공','成功'], 'No Content': ['내용 없음','内容なし'],
  'Empty response body': ['응답 본문 없음','レスポンスボディなし'], 'Filter Properties': ['속성 검색','プロパティを検索'],
};
const extensions = [uiTranslations(), openapiTranslations()];
const keys = [...new Set(extensions.flatMap(extension => extension.keys))];
const dictionary = (index: 0 | 1) => Object.fromEntries(keys.flatMap(key => {
  const value = words[key.split('(')[0]]?.[index];
  return value ? [[key, value]] : [];
}));
export const translations = i18n.translations().extend(extensions[0]).extend(extensions[1]).add({
  ko: { ...dictionary(0), displayName: '한국어' },
  ja: { ...dictionary(1), displayName: '日本語' },
  en: { displayName: 'English' },
});
