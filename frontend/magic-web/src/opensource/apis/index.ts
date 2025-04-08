import { generateContactApi } from "./modules/contact"
import magicClient from "./clients/magic"
import chatWebSocketClient from "./clients/chatWebSocket"
import { generateUserApi } from "./modules/user"
import { generateCommonApi } from "./modules/common"
import { generateAuthApi } from "./modules/auth"
import { generateBotApi } from "./modules/bot"
import { generateCalendarApi } from "./modules/calendar"
import { generateFavoritesApi } from "./modules/favorites"
import { generateFileApi } from "./modules/file"
import { generateFlowApi } from "./modules/flow"
import { generateKnowledgeApi } from "./modules/knowledge"
import { generateSearchApi } from "./modules/search"
import { generateChatApi } from "./modules/chat"

/** 重置服务 */
export const UserApi = generateUserApi(magicClient)
export const CommonApi = generateCommonApi(magicClient)

/** Magic 服务 */
export const AuthApi = generateAuthApi(magicClient)
export const ContactApi = generateContactApi(magicClient)
export const BotApi = generateBotApi(magicClient)
export const CalendarApi = generateCalendarApi(magicClient)
export const FavoritesApi = generateFavoritesApi(magicClient)
export const FileApi = generateFileApi(magicClient)
export const FlowApi = generateFlowApi(magicClient)
export const KnowledgeApi = generateKnowledgeApi(magicClient)
export const SearchApi = generateSearchApi(magicClient)
export const ChatApi = generateChatApi(magicClient, chatWebSocketClient)
