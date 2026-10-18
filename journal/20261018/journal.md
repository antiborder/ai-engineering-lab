# 2026-10-18 作業記録

## 今日のゴール

AI Playground を公開する。AIの従量課金がかからず、ページと学習コンテンツがスムーズに表示されることが条件。

## 決めたこと

- **公開方式は「プランA」**：バックエンドの処理をすべてブラウザ側に移植し、完全な静的サイトとして公開する。
- **ホスティングは Firebase Hosting（無料のSparkプラン）**：既存のFirebaseプロジェクト `ai-playland` を使う。
  - 設計書（`docs/spec.txt` 36〜38節）では Cloud Storage＋Cloud Run＋Firestore を予定していた。
  - Cloud Storage だけでは、独自ドメインでHTTPS配信するのに有料のロードバランサが必要になる。そのため Firebase Hosting を選んだ。
  - 月額は無料枠の範囲内で ¥0。独自ドメインは任意で、年 ¥1,500〜2,000 程度。
- この決定は `docs/decisions/0002-static-site-on-firebase-hosting.md` に記録した。
- アプリ名は「AI Playground」（`frontend/lib/brand.ts`）。日本語の愛称「あそんで学ぶAI」はUIでは使わない。

## やったこと

1. **GenAIの処理をブラウザに移植**（`frontend/features/genai/engine/`）
   - モックLLM、RAG（TF-IDF検索・チャンク分割・リランク）、ツール呼び出し、エージェント、構造化出力（Ajvで検証）。
   - 結果とエラーメッセージは、Python版と同じ形になるように合わせた。
2. **Tiny LLM を TensorFlow.js に移植**（`frontend/features/fundamentals/tiny-llm/`）
   - PyTorch版と同じ構成のTransformer（パラメータ数 29,568）。WebGLで学習し、使えない環境ではCPUで学習する。
3. **保存先を localStorage に変更**：RAGのドキュメントとAI Artifactは、訪問者自身のブラウザに保存する。
4. **Next.js の静的エクスポート**（`output: "export"`）に対応した。URLのクエリは、クライアント側で `useSearchParams` を使って読む。
5. **テスト**：移植した処理のテストを追加した。47件すべて成功。
6. **デプロイ**：https://ai-playland.web.app に公開した。主要ページの表示、リダイレクト、404、キャッシュヘッダを確認した。
7. **コミット**：ブランチ `static-site-firebase-hosting` を作ってコミットし、`main` にマージしてpushした。
8. **ドキュメント更新**：`README.md`、`docs/architecture/local-dev.md`、`docs/spec.txt` 36〜38節（「Superseded」の注記を追加）、`docs/decisions/0002`。

## つまずいたこと

- **Tiny LLM の生成が公開サイトで止まったように見えた**
  - 原因：文脈の長さが1文字増えるたびに入力テンソルの形が変わり、WebGLがGPUプログラムを毎回コンパイルし直していた。
  - 対策：入力を常に `block_size` の長さにそろえ、後ろを0で埋めた。因果マスクがあるので、結果は変わらない（テストで確認済み）。ローカルでは200文字の生成が2.5秒になった。
- **学習が1ステップ1秒かかるように見えた**：Chromeが非表示タブのタイマーを間引いていたことによる見かけ上の遅さだった。表示中のタブでは1ステップ約50ミリ秒。
- **Hostingエミュレータが403を返した**：macOSのAirPlayがポート5000を使っていた。エミュレータのポートを5050に変更した。

## 未解決・次回

- 公開サイトでの Tiny LLM の生成速度を、実機（PC・iPhone）で確認する。
- iPhoneで「音楽の再生バー」のようなものが出た件：アプリには音声・動画のコードがない。再現したら、URL・表示場所・スクリーンショットを確認する。
- `backend/` はブラウザ移植の参照用として残している。不要になったら削除を検討する。
