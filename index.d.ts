import type { Types } from "mongoose";

declare module 'h3' {
  interface H3EventContext {
    user?: Types.ObjectId // Расширяем стандартный контекст
  }
}

export {}; // Обязательно для превращения файла в модуль
