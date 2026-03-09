# Comandos para subir o projeto para o GitHub

Execute no terminal, na pasta do projeto:

```bash
cd C:\Users\afmna\Documents\PROJETOS\BARBEIRO

git add .
git status
git commit -m "Renomear projeto para Meu Barbeiro (meubarbeiro)"
git push origin main
```

Se o remote ainda não estiver configurado:

```bash
git remote add origin git@github.com:pedindooficial/meubarbeiro.git
git branch -M main
git push -u origin main
```

Se preferir HTTPS em vez de SSH:

```bash
git remote add origin https://github.com/pedindooficial/meubarbeiro.git
git branch -M main
git push -u origin main
```
