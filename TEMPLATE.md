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
| `header-instagram` | 奄美Instagram まとめ | #405de6 → #833ab4 → #c13584 → #e1306c → #fd1d1d |
| `header-trend` | ITネタトレンド | #0f2027 → #203a43 → #2c5364 |
| `header-top` | トップページ | #232526 → #414345 |
| `header-ferry` | フェリー運行状況 | #0077b6 → #0096c7 → #00b4d8 |
| `header-municipal` | 自治体イベント | #2d6a4f → #40916c → #52b788 |
| `header-creditcard` | クレジットカード キャンペーン | #1a237e → #283593 → #3949ab |

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
    </div>
    <div class="post-meta">
      <span class="badge badge-account">{{アカウント名}}</span>
      <span class="badge badge-{{カテゴリ}}">{{ラベル}}</span>
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
| `badge-account` | アカウント名 | グレー (#e9ecef / #495057) |

| `badge-normal` | 通常運航 | 緑 (#e6f9e6 / #1a8a1a) |
| `badge-conditional` | 条件付運航 | オレンジ (#fff3e0 / #e65100) |
| `badge-delay` | 遅延 | オレンジ (#fff3e0 / #e65100) |
| `badge-cancelled` | 欠航 | 赤 (#fce4ec / #c62828) |
| `badge-info` | お知らせ | 青 (#e8f4fd / #1a73e8) |

| `badge-amami` | 奄美市 | 青 (#e8f4fd / #1a73e8) |
| `badge-tatsugo` | 龍郷町 | 緑 (#e6f9e6 / #1a8a1a) |
| `badge-yamato` | 大和村 | 紫 (#f3e8fd / #7b1fa2) |
| `badge-setouchi` | 瀬戸内町 | オレンジ (#fff3e0 / #e65100) |
| `badge-uken` | 宇検村 | 赤 (#fce4ec / #c62828) |

| `badge-cc-points` | ポイント特典 | 青 (#e8f4fd / #1a73e8) |
| `badge-cc-cashback` | キャッシュバック | 緑 (#e6f9e6 / #1a8a1a) |
| `badge-cc-fee` | 年会費無料 | 紫 (#f3e8fd / #7b1fa2) |
| `badge-cc-bonus` | 利用ボーナス | オレンジ (#fff3e0 / #e65100) |
| `badge-cc-other` | その他 | グレー (#e9ecef / #495057) |
| `badge-cc-urgent` | 終了間近 | 赤 (#fce4ec / #c62828) |

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
    <li>{{項目}} <sub>最終投稿: {{YYYY-MM-DD}}</sub></li>
    <li><span class="badge badge-cancelled">非アクティブ</span> {{項目}}</li>
  </ul>
</div>
```

- `last_post_date` がある場合は `<sub>最終投稿: YYYY-MM-DD</sub>` を項目の後に表示
- `last_post_date` が null の場合は省略
- 非アクティブ条件を満たす場合は `badge-cancelled` バッジを項目の前に表示

## 新しいページを追加する手順

1. `C:\Okishima\Open\{name}\index.html` を作成（上記の基本構造に従う）
2. 必要なら `style.css` にヘッダークラス `header-{name}` と新しいバッジクラスを追加
3. `C:\Okishima\Open\index.html`（トップページ）にナビゲーションカードを追加:
   ```html
   <a href="{name}/" class="page-link" data-updated="{{YYYY-MM-DDTHH:MM}}">
     <span class="arrow">&#8250;</span>
     <h2>{{ページ名}}</h2>
     <p>{{説明}}</p>
     <div class="updated">🕐 {{YYYY-MM-DD HH:MM}} 更新</div>
   </a>
   ```
4. スキルの出力仕様では「`TEMPLATE.md` に従ってHTMLを生成」と記載する

## トップページ更新ルール

各スキルがHTMLを出力する際、**トップページ（`C:\Okishima\Open\index.html`）の該当カードも更新**する:

1. `data-updated` 属性を実行日時（ISO形式 `YYYY-MM-DDTHH:MM`）に更新
2. `.updated` 要素のテキストを `🕐 YYYY-MM-DD HH:MM 更新` に更新

これにより:
- 各ページの最終更新日時がトップページに表示される
- 未確認の更新に `NEW` バッジが自動表示される（JavaScript + localStorage）
- ユーザーがページを訪問すると `NEW` バッジが消える
