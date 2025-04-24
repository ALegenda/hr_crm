FROM node:20-alpine

WORKDIR /app

# Установка необходимых системных зависимостей
RUN apk add --no-cache python3 make g++ openssl

# Копирование package.json и package-lock.json
COPY package*.json ./

# Установка зависимостей
RUN npm install

# Копирование файлов Prisma (схема и миграции)
COPY prisma ./prisma/

# Создание пустого файла .env если он не существует
RUN touch .env

# Генерация Prisma клиента
RUN npx prisma generate

# Повторная установка bcrypt для правильной работы в Alpine Linux
RUN npm uninstall bcrypt && npm install bcrypt

# Копирование остальных файлов проекта
COPY . .

EXPOSE 3000

# Применение миграций при запуске контейнера и запуск сервера
CMD npx prisma migrate deploy && npm run dev 