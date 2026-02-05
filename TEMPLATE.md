# HTML テンプレート仕様

各スキルが `C:\Okishima\Open\` 配下にHTMLを生成する際、この仕様に従うこと。
共通部分はここで一元管理し、各スキルではコンテンツ部分のみを定義する。

## 共通CSS

すべてのページは共通CSSを参照する。**インラインCSSは書かない。**

```html
<link rel="stylesheet" href="../style.css">
```

CSSの変更は `C:\Okishima\Open\style.css` のみで行う。

## HTML基本構造

```html
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{ページタイトル}}</title>
<link rel="stylesheet" href="../style.css">
</head>
<body>
<div class="container">

<div class="breadcrumb"><a href="../">Okishima Open</a> &gt; {{セクション名}}</div>

<header class="{{ヘッダークラス}}">
  <h1>{{ページタイトル}}</h1>
</header>
<div class="timestamp">🕐 {{YYYY-MM-DD HH:MM}} 更新</div>

<!-- ここにコンテンツセクションを配置 -->

</div>
</body>
</html>
```

## ヘッダークラス一覧

| クラス名 | 用途 | グラデーション |
|---------|------|--------------|
| `header-instagram` | Instagram まとめ | #405de6 → #833ab4 → #c13584 → #e1306c → #fd1d1d |
| `header-trend` | トレンドネタ | #0f2027 → #203a43 → #2c5364 |
| `header-top` | トップページ | #232526 → #414345 |

新しいページを追加する場合は `style.css` に `header-{name}` クラスを追加する。

## 更新日時（timestamp）

- テキスト形式: `🕐 YYYY-MM-DD HH:MM 更新`（時刻がない場合は `🕐 YYYY-MM-DD 更新`）
- **headerタグの外、直下に配置**（ヘッダーとコンテンツの間）
- CSSクラス: `.timestamp`（右寄せ、グレー小文字、style.css で定義済み）

## コンテンツセクション

### セクション見出し + カード

```html
<div class="section-title">{{セクション名}}<br><sub>{{補足情報}}</sub></div>
<div class="card">
  <div class="post">
    <div class="post-title">
      <a href="{{URL}}" target="_blank">{{タイトル}}</a>
      <span class="badge badge-{{カテゴリ}}">{{ラベル}}</span>
    </div>
    <div class="post-meta">
      <span class="account">{{アカウント名}}</span>
      <span>{{エンゲージメント}}</span>
      <span>{{日付}}</span>
    </div>
    <div class="post-summary">{{概要}}</div>
  </div>
  <!-- 投稿を繰り返し -->
</div>
```

### カテゴリバッジ一覧

| クラス | 用途 | 色 |
|-------|------|-----|
| `badge-event` | イベント | 青 (#e8f4fd / #1a73e8) |
| `badge-product` | 新商品 | 緑 (#e6f9e6 / #1a8a1a) |
| `badge-season` | 季節の話題 | オレンジ (#fff3e0 / #e65100) |
| `badge-area` | 地域・特産品 | 紫 (#f3e8fd / #7b1fa2) |
| `badge-food` | グルメ | 赤 (#fce4ec / #c62828) |
| `badge-ai` | AI | 青 (#e8f4fd / #1a73e8) |
| `badge-security` | セキュリティ | 赤 (#fce4ec / #c62828) |
| `badge-dev` | 開発 | 緑 (#e6f9e6 / #1a8a1a) |
| `badge-career` | キャリア | オレンジ (#fff3e0 / #e65100) |
| `badge-oss` | OSS | 紫 (#f3e8fd / #7b1fa2) |

新しいバッジが必要な場合は `style.css` に追加する。

### 興味度（トレンド用）

```html
<span class="stars">★★★</span>
```

### 投稿なし / ミュートセクション

```html
<div class="muted-section">
  <h2>{{見出し}}</h2>
  <ul class="muted-list">
    <li>{{項目}}</li>
  </ul>
</div>
```

## 新しいページを追加する手順

1. `C:\Okishima\Open\{name}\index.html` を作成（上記の基本構造に従う）
2. 必要なら `style.css` にヘッダークラス `header-{name}` と新しいバッジクラスを追加
3. `C:\Okishima\Open\index.html`（トップページ）にナビゲーションカードを追加:
   ```html
   <a href="{name}/" class="page-link">
     <span class="arrow">&#8250;</span>
     <h2>{{ページ名}}</h2>
     <p>{{説明}}</p>
   </a>
   ```
4. スキルの出力仕様では「`TEMPLATE.md` に従ってHTMLを生成」と記載する
