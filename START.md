# VOID.DEV 启动指南

## 启动服务器

```bash
cd F:\personalblog
python -m http.server 8080 --bind 0.0.0.0
```

如果 8080 端口被占用，先杀掉旧进程：

```bash
# Windows
netstat -ano | findstr :8080
taskkill /F /PID <进程号>

# 或者直接用别的端口
python -m http.server 3000 --bind 0.0.0.0
```

## 访问地址

先查本机局域网 IP：

```bash
ipconfig
# 找 "IPv4 地址" 那一行，一般是 192.168.x.x 或 10.x.x.x
```

### 电脑访问

| 页面 | 地址 |
|------|------|
| 前台博客 | http://localhost:8080 |
| 后台管理 | http://localhost:8080/admin/ |

### 手机访问（同一 WiFi）

| 页面 | 地址 |
|------|------|
| 前台博客 | http://<你的IP>:8080 |
| 后台管理 | http://<你的IP>:8080/admin/ |

例如：`http://192.168.43.4:8080`

> 手机打不开？检查：
> 1. 电脑和手机在同一 WiFi
> 2. 用 `--bind 0.0.0.0` 启动（不是默认的 localhost）
> 3. Windows 防火墙放行 8080 端口

## 停止服务器

终端按 `Ctrl+C`

## 部署到 GitHub Pages

```bash
cd F:\personalblog
git remote add origin https://github.com/<用户名>/<仓库名>.git
git push -u origin main
```

然后去仓库 → Settings → Pages → Source 选 **GitHub Actions**

访问 `https://<用户名>.github.io`
