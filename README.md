# Launch Lab 21

**Пройди модули — one-pager соберётся сам.**

Прототип платформы цифрового инкубатора School 21. Команда стартапа последовательно проходит 9 модулей
программы, заполняя структурированные шаблоны с подсказками, а платформа автоматически собирает ответы
в готовый one-pager проекта. Куратор видит прогресс всех команд, комментирует ответы и управляет содержанием
модулей.

## Запуск

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production-сборка в dist/
npm run preview    # просмотр собранной версии
```

Требуется Node.js 20+. Бэкенда нет: всё состояние хранится в `localStorage` (ключ `launch-lab-21:state`,
с версией схемы). Кнопка «Сбросить демо-данные» в шапке возвращает исходные мок-данные.

## Демо-акторы

| Роль | Актор | Что показать |
| --- | --- | --- |
| Команда | **PeerPair** | 4 из 9 модулей пройдено, модуль 5 — черновик, 2 комментария куратора |
| Команда | **ReviewHub** | 9 из 9 — полностью собранный one-pager для презентационного режима |
| Команда | **Track21** | 0 из 9 — проект есть, модули пустые |
| Команда | **Новая команда** | проекта нет — открывается мастер создания |
| Куратор | **Дарья Ким** | дашборд всех команд, комментарии, редактор контента модулей |

## Архитектура

```
src/
  types.ts                  модель данных (Actor, Project, ModuleTemplate, ModuleAnswer, CuratorComment, ActivityEvent, OnePager)
  data/                     справочник 9 модулей + мок-проекты трёх команд
  access/canAccess.ts       единая точка авторизации: canAccess(actor, action, targetProjectId, ctx)
  services/
    modules.ts              validateModuleAnswer, getModuleStatus, computeOverallProgress, getCurrentModule
    onePager.ts             assembleOnePager — чистая производная one-pager из ответов
    mutations.ts            createProject, saveModuleAnswer, addCuratorComment, updateModuleTemplate (все через assertAccess)
    selectors.ts            selectVisibleProjects / selectAnswers / selectComments / selectActivity (все через canAccess)
  state/                    Context + reducer (единый источник истины), persistence с версией схемы
  components/               дизайн-система, guards (RequireRole / RequireAccess / AccessDenied), OnePagerDocument
  screens/                  peer/*, curator/*, OnePagerScreen, PresentScreen, ActivityScreen, RoleSelectScreen
```

### Изоляция ролей

- Все чтения данных на экранах идут через селекторы, а селекторы — через `canAccess`. Пир получает из
  `selectVisibleProjects` ровно один проект, а `selectAnswers(чужойId)` возвращает пустой массив.
- Все мутации проходят через `assertAccess` в сервисном слое; редьюсер перехватывает `AccessDeniedError`
  и показывает тост, не меняя состояние.
- Маршруты `/peer/*` и `/curator/*` закрыты `RequireRole`; глубокие ссылки (`#/curator/project/:id`,
  `#/present/:id`) у пира упираются в экран «Доступ запрещён» без рендера чужих данных.
- Полномочия куратора (редактировать контент, комментировать) настраиваются тумблерами и учитываются в `canAccess`.

### Статусы модулей

- `not_started` — ничего не введено; `in_progress` — есть текст, но не все обязательные поля; `completed` — все
  обязательные заполнены. Статус вычисляется `validateModuleAnswer` и пересчитывается для всех команд при изменении
  шаблона куратором.
- Третье визуальное состояние **«текущий»** — первый по порядку незавершённый модуль (`getCurrentModule`): выделен
  акцентной рамкой, пульсацией и бейджем «Следующий шаг».
