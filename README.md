# PharmaHot

全球医药研发热点聚合 Demo：真实来源、可点击原文、Hot Rank、分类筛选与每周自动更新。

## Public site

GitHub Pages 配置完成后访问：`https://luli792366-commits.github.io/pharmahot/`

## Data sources

- EMA official news feed
- FDA Press Announcements (official source link; dedicated parser planned)
- Fierce Biotech / Fierce Pharma RSS

## Automation

`.github/workflows/update-news.yml` 每周一 00:17 UTC 自动运行，也支持手动 `Run workflow`。

## Deployment

`.github/workflows/pages.yml` 在 main 更新后部署 GitHub Pages。若首次部署提示 Pages 尚未启用，请在 GitHub 仓库 `Settings → Pages → Build and deployment → Source` 选择 **GitHub Actions**，之后重新运行 `Deploy GitHub Pages`。
