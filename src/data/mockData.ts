import type { Actor, ActivityEvent, CuratorComment, ModuleAnswer, Project } from '../types';

const daysAgo = (d: number, h = 10) => {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  dt.setHours(h, 0, 0, 0);
  return dt.toISOString();
};

export const PROJECT_A_ID = 'p-peerpair';
export const PROJECT_B_ID = 'p-reviewhub';
export const PROJECT_C_ID = 'p-track21';

export const CURATOR_NAME = 'Дарья Ким';

/** Демо-акторы для переключателя роли. Пир «Новая команда» проекта ещё не имеет — попадает в мастер создания. */
export const DEMO_ACTORS: Actor[] = [
  { id: 'peer-a', name: 'Команда PeerPair', role: 'peer', projectId: PROJECT_A_ID },
  { id: 'peer-b', name: 'Команда ReviewHub', role: 'peer', projectId: PROJECT_B_ID },
  { id: 'peer-c', name: 'Команда Track21', role: 'peer', projectId: PROJECT_C_ID },
  { id: 'peer-new', name: 'Новая команда', role: 'peer' },
  { id: 'curator-1', name: CURATOR_NAME, role: 'curator' },
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: PROJECT_A_ID,
    name: 'PeerPair',
    hook: 'AI-компаньон, который за 30 секунд находит напарника на пару',
    category: 'EdTech · AI',
    description:
      'Telegram-бот и веб-панель для пиров School 21: подбирает напарника для peer-review и парного программирования по расписанию, уровню и истории совместной работы.',
    team: [
      { name: 'Алина Сафина', role: 'Продукт и дизайн' },
      { name: 'Марат Исмагилов', role: 'Backend (Go)' },
      { name: 'Даниил Орлов', role: 'ML и матчинг' },
    ],
    createdAt: daysAgo(21),
    updatedAt: daysAgo(1, 18),
  },
  {
    id: PROJECT_B_ID,
    name: 'ReviewHub',
    hook: 'Маркетплейс код-ревью от senior-разработчиков за 24 часа',
    category: 'DevTools · Marketplace',
    description:
      'Платформа, где начинающие разработчики заказывают развёрнутое код-ревью у проверенных сеньоров, а ревьюеры монетизируют экспертизу в свободное время.',
    team: [
      { name: 'Егор Власов', role: 'CEO, продажи' },
      { name: 'Софья Лебедева', role: 'Frontend (React)' },
      { name: 'Тимур Гареев', role: 'Backend и инфраструктура' },
      { name: 'Ника Попова', role: 'Комьюнити и ревьюеры' },
    ],
    createdAt: daysAgo(45),
    updatedAt: daysAgo(2, 15),
  },
  {
    id: PROJECT_C_ID,
    name: 'Track21',
    hook: 'Трекер учебного прогресса, который показывает, где ты застрял',
    category: 'EdTech · Analytics',
    description:
      'Персональный дашборд пира: собирает данные о проектах, дедлайнах и ревью и подсказывает, на что потратить ближайшие 3 часа.',
    team: [
      { name: 'Кирилл Жуков', role: 'Fullstack' },
      { name: 'Мария Волкова', role: 'Аналитика данных' },
    ],
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  },
];

const answer = (
  projectId: string,
  moduleTemplateId: string,
  values: Record<string, string>,
  status: ModuleAnswer['status'],
  updatedAt: string,
): ModuleAnswer => ({
  id: `${projectId}__${moduleTemplateId}`,
  projectId,
  moduleTemplateId,
  values,
  status,
  updatedAt,
});

export const MOCK_ANSWERS: ModuleAnswer[] = [
  // ─── Команда A: PeerPair — модули 1–4 завершены, 5 — черновик ───
  answer(
    PROJECT_A_ID,
    'm1',
    {
      statement:
        'Пиры School 21 тратят до 40 минут в день на поиск напарника для peer-review и парного программирования, потому что нет единого места, где видно, кто свободен и подходит по уровню.',
      who_suffers:
        'Пиры на первых 1–3 месяцах основной программы: круг знакомых ещё мал, а дедлайны по проектам уже требуют регулярных ревью. Особенно страдают те, кто учится по вечерам и в выходные.',
      evidence:
        'Опросили 32 пира — 26 назвали поиск напарника главной потерей времени\nВ общем чате кампуса ежедневно 15–20 сообщений «кто свободен на ревью?»\n7 из 10 интервьюируемых хотя бы раз срывали дедлайн из-за отсутствия ревьюера',
    },
    'completed',
    daysAgo(18),
  ),
  answer(
    PROJECT_A_ID,
    'm2',
    {
      essence:
        'Telegram-бот и веб-панель, которые за 30 секунд подбирают напарника для ревью или пары по свободным слотам, уровню проекта и истории совместной работы.',
      features:
        'Матчинг по свободным слотам и текущему проекту\nРейтинг надёжности напарника (пришёл / не пришёл)\nНапоминания о встрече и автоматическое бронирование переговорки\nИстория ревью с заметками',
      uniqueness:
        'В отличие от общего чата, мы учитываем реальную занятость пира и его историю: с кем уже работал, кто регулярно опаздывает. Это превращает случайный поиск в предсказуемый процесс.',
    },
    'completed',
    daysAgo(15),
  ),
  answer(
    PROJECT_A_ID,
    'm3',
    {
      segment:
        'Пиры School 21 в первые полгода основной программы, которые бывают в кампусе 4+ дня в неделю и делают минимум 2 ревью в неделю.',
      size: '≈ 1 200 активных пиров в кампусе Казани, 6 000+ по всей сети кампусов',
      need: 'Быстро найти надёжного напарника, чтобы не срывать дедлайн проекта и не тратить время на переписку.',
    },
    'completed',
    daysAgo(11),
  ),
  answer(
    PROJECT_A_ID,
    'm4',
    {
      model:
        'Freemium для пиров: базовый матчинг бесплатно, расширенная аналитика и приоритет в очереди — по подписке. B2B-лицензия для кампусов и IT-школ.',
      pricing: 'Pro — 199 ₽/мес для пира; Campus — 25 000 ₽/мес для кампуса до 1 000 человек.',
      unit_economics: 'CAC ≈ 0 ₽ (органический рост внутри кампуса), LTV Pro ≈ 1 200 ₽ за 6 месяцев.',
    },
    'completed',
    daysAgo(7),
  ),
  answer(
    PROJECT_A_ID,
    'm5',
    {
      market_size:
        'SAM: ~40 IT-школ и буткемпов в РФ × 300 000 ₽/год ≈ 12 млн ₽/год. TAM с онлайн-школами и университетами — 200+ млн ₽/год.',
      competitors: '',
      differentiation: '',
    },
    'in_progress',
    daysAgo(1, 18),
  ),

  // ─── Команда B: ReviewHub — все 9 модулей завершены ───
  answer(
    PROJECT_B_ID,
    'm1',
    {
      statement:
        'Начинающие разработчики не получают качественной обратной связи по коду: на курсах ревью формальное, а на работе сеньоры перегружены. В итоге плохие практики закрепляются на годы.',
      who_suffers:
        'Джуниоры и выпускники буткемпов в первые 1–2 года карьеры, а также self-taught разработчики без наставника. В России их 150 000+.',
      evidence:
        'Опрос 120 джуниоров: 78% не получали развёрнутого ревью ни разу за последние 3 месяца\nВ 14 из 20 интервью с тимлидами — «нет времени на ревью джунов»\nСпрос на менторов на Solvery и GetMentor вырос в 3 раза за 2 года',
    },
    'completed',
    daysAgo(40),
  ),
  answer(
    PROJECT_B_ID,
    'm2',
    {
      essence:
        'Маркетплейс, где разработчик за фиксированную цену получает развёрнутое код-ревью от проверенного senior-разработчика в течение 24 часов.',
      features:
        'Загрузка репозитория или PR по ссылке за 1 минуту\nАвтоподбор ревьюера по стеку и опыту\nСтруктурированный отчёт: критичные ошибки, архитектура, стиль, что почитать\nВидеозвонок-разбор 30 минут как опция\nРейтинг и верификация ревьюеров',
      uniqueness:
        'Мы продаём не «время ментора», а гарантированный результат: отчёт по шаблону за 24 часа. Ревьюеры проходят верификацию через реальные задачи, а не просто заполняют профиль.',
    },
    'completed',
    daysAgo(38),
  ),
  answer(
    PROJECT_B_ID,
    'm3',
    {
      segment:
        'Джуниор-разработчики 20–28 лет, которые уже ищут первую работу или работают 6–18 месяцев и готовы платить за ускорение карьеры.',
      size: '≈ 150 000 джуниоров в РФ; ядро — 25 000 выпускников буткемпов и IT-школ в год',
      need: 'Понять, что не так с моим кодом, и получить конкретный план, как расти, — от человека, которому можно доверять.',
    },
    'completed',
    daysAgo(35),
  ),
  answer(
    PROJECT_B_ID,
    'm4',
    {
      model: 'Комиссия 25% с каждого заказа + подписка «Growth» с 2 ревью в месяц по сниженной цене. B2B-пакеты для школ и буткемпов.',
      pricing: 'Разовое ревью — 2 900 ₽; Growth — 4 900 ₽/мес; B2B — от 80 000 ₽/мес за 50 ревью.',
      unit_economics:
        'Средний чек 3 200 ₽, комиссия 800 ₽, CAC через контент-маркетинг ≈ 600 ₽, средний клиент делает 3,4 заказа → LTV ≈ 2 700 ₽.',
    },
    'completed',
    daysAgo(32),
  ),
  answer(
    PROJECT_B_ID,
    'm5',
    {
      market_size:
        'SOM: 25 000 выпускников × 3 ревью × 3 000 ₽ ≈ 225 млн ₽/год. SAM (все джуниоры РФ) ≈ 1,3 млрд ₽. TAM с СНГ и B2B — 4+ млрд ₽.',
      competitors: 'Solvery и GetMentor (менторы почасово)\nCodementor (зарубежный, $$)\nБесплатные ревью в Telegram-чатах\nAI-ревьюеры: Copilot Review, CodeRabbit',
      differentiation:
        'Единственный сервис с гарантированным SLA 24 часа и структурированным отчётом. Не почасовая аренда ментора, а продукт с предсказуемым результатом. AI мы используем для предварительной разметки, а не вместо человека.',
    },
    'completed',
    daysAgo(28),
  ),
  answer(
    PROJECT_B_ID,
    'm6',
    {
      members:
        'Егор Власов — CEO, 4 года в продажах B2B EdTech (Skillbox)\nСофья Лебедева — Frontend, ex-Tinkoff, 3 года React\nТимур Гареев — Backend и инфраструктура, ex-Ozon\nНика Попова — комьюнити-менеджер, собрала сообщество 5 000 разработчиков',
      competencies: 'Продажи, разработка полного цикла, построение комьюнити. Не хватает: юрист по самозанятым/выплатам — закрываем через аутсорс.',
      done: '120 интервью с джуниорами и 20 с тимлидами\nMVP на no-code + Telegram, 63 платных заказа за 6 недель\n38 верифицированных ревьюеров\nСредняя оценка ревью 4,8/5',
    },
    'completed',
    daysAgo(22),
  ),
  answer(
    PROJECT_B_ID,
    'm7',
    {
      metrics: '63 платных заказа за 6 недель\nВыручка 201 000 ₽, GMV растёт +40% месяц к месяцу\n38 ревьюеров, 31% повторных заказов\nNPS 71',
      achievements:
        'Пилот с буткемпом «Яндекс Практикум»-выпускниками (30 ревью); публикация на Хабре — 40 000 просмотров; финалисты Startup Village Junior.',
      next_goal: '300 заказов в месяц и 100 ревьюеров к 1 декабря 2026',
    },
    'completed',
    daysAgo(12),
  ),
  answer(
    PROJECT_B_ID,
    'm8',
    {
      next_steps:
        'Запустить веб-платформу вместо no-code (октябрь)\nПодключить оплату и выплаты самозанятым через партнёра (ноябрь)\nПервый B2B-контракт с IT-школой (декабрь)',
      mvp_deadline: '31 октября 2026',
      vision:
        'Стать стандартом качества кода для начинающих разработчиков в СНГ: «сертификат ReviewHub» как сигнал для работодателей.',
    },
    'completed',
    daysAgo(8),
  ),
  answer(
    PROJECT_B_ID,
    'm9',
    {
      ask: 'Ментор по масштабированию маркетплейсов и юридической схеме выплат, интро в 3 IT-школы для B2B-пилота, грант на разработку.',
      specifics:
        '8 часов менторства с фаундером маркетплейса\n3 интро в IT-школы (Яндекс Практикум, Skillfactory, Elbrus)\n300 000 ₽ на разработку платформы и юр. сопровождение',
      usage: 'Выпуск веб-платформы к концу октября и закрытие первого B2B-контракта, что выведет проект на 500 000 ₽ MRR к концу года.',
    },
    'completed',
    daysAgo(2, 15),
  ),

  // ─── Команда C: Track21 — ни одного заполненного модуля ───
];

export const MOCK_COMMENTS: CuratorComment[] = [
  {
    id: 'c1',
    projectId: PROJECT_A_ID,
    moduleTemplateId: 'm1',
    author: CURATOR_NAME,
    text: 'Отличные доказательства с цифрами из опроса. Добавьте одну цитату из интервью дословно — на демо-дне это сильнее любых процентов.',
    createdAt: daysAgo(16, 14),
  },
  {
    id: 'c2',
    projectId: PROJECT_A_ID,
    moduleTemplateId: 'm3',
    author: CURATOR_NAME,
    text: 'Размер аудитории по сети кампусов — хорошо, но уточните, какая доля пиров реально делает 2+ ревью в неделю. Это ваш настоящий SOM.',
    createdAt: daysAgo(10, 12),
  },
  {
    id: 'c3',
    projectId: PROJECT_B_ID,
    moduleTemplateId: 'm7',
    author: CURATOR_NAME,
    text: 'Трекшн впечатляет. Для питча выделите одну «главную» метрику — 31% повторных заказов говорит о продукте больше, чем выручка.',
    createdAt: daysAgo(11, 16),
  },
];

export const MOCK_ACTIVITY: ActivityEvent[] = [
  { id: 'a1', type: 'project_created', projectId: PROJECT_B_ID, createdAt: daysAgo(45), text: 'Проект «ReviewHub» создан', actorName: 'Команда ReviewHub' },
  { id: 'a2', type: 'project_created', projectId: PROJECT_A_ID, createdAt: daysAgo(21), text: 'Проект «PeerPair» создан', actorName: 'Команда PeerPair' },
  { id: 'a3', type: 'module_completed', projectId: PROJECT_A_ID, createdAt: daysAgo(18), text: 'Модуль «Проблема» завершён', actorName: 'Команда PeerPair' },
  { id: 'a4', type: 'comment_added', projectId: PROJECT_A_ID, createdAt: daysAgo(16, 14), text: 'Куратор оставил комментарий к модулю «Проблема»', actorName: CURATOR_NAME },
  { id: 'a5', type: 'module_completed', projectId: PROJECT_A_ID, createdAt: daysAgo(15), text: 'Модуль «Решение» завершён', actorName: 'Команда PeerPair' },
  { id: 'a6', type: 'module_completed', projectId: PROJECT_B_ID, createdAt: daysAgo(12), text: 'Модуль «Метрики и трекшн» завершён', actorName: 'Команда ReviewHub' },
  { id: 'a7', type: 'module_completed', projectId: PROJECT_A_ID, createdAt: daysAgo(11), text: 'Модуль «Целевая аудитория» завершён', actorName: 'Команда PeerPair' },
  { id: 'a8', type: 'comment_added', projectId: PROJECT_B_ID, createdAt: daysAgo(11, 16), text: 'Куратор оставил комментарий к модулю «Метрики и трекшн»', actorName: CURATOR_NAME },
  { id: 'a9', type: 'comment_added', projectId: PROJECT_A_ID, createdAt: daysAgo(10, 12), text: 'Куратор оставил комментарий к модулю «Целевая аудитория»', actorName: CURATOR_NAME },
  { id: 'a10', type: 'module_completed', projectId: PROJECT_A_ID, createdAt: daysAgo(7), text: 'Модуль «Бизнес-модель» завершён', actorName: 'Команда PeerPair' },
  { id: 'a11', type: 'project_created', projectId: PROJECT_C_ID, createdAt: daysAgo(3), text: 'Проект «Track21» создан', actorName: 'Команда Track21' },
  { id: 'a12', type: 'module_completed', projectId: PROJECT_B_ID, createdAt: daysAgo(2, 15), text: 'Модуль «Запрос (Ask)» завершён — one-pager собран полностью', actorName: 'Команда ReviewHub' },
  { id: 'a13', type: 'answer_saved', projectId: PROJECT_A_ID, createdAt: daysAgo(1, 18), text: 'Черновик модуля «Рынок и конкуренты» сохранён', actorName: 'Команда PeerPair' },
];
