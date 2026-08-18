import { CampusLocation, CampusTourRoute } from '../types';

export const LILI_GUIDE_AGENT = {
    name: '丽丽学姐',
    fullName: '广大校园伴游向导 · 丽丽 (Lili)',
    role: '计算机学院大三在读 / 广大校园向导团团长',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
    welcomeSpeech: '嗨～学弟学妹好呀！我是你们的广大伴游学姐丽丽！今天由我带大家漫游广大大学城校区。点击地图上的任意地标或者选择上方的特色路线，我来为你语音解说每一个角落的故事与避坑小秘密～',
    prompt: `你叫“丽丽”，是广州大学计算机与网络空间安全学院大三的女大学生，同时也是学校的官方向导团团长。你的性格活泼开朗、元气满满、大实话、接地气，对广州大学大学城校区和黄埔校区了如指掌。你非常乐于给未来的学弟学妹和家长介绍广大的真实就读体验（自习室占座攻略、食堂招牌菜、宿舍空调热水、专业就业前景等）。你的语言风格亲切自然，善用“学弟学妹”、“我跟你说呀”、“悄悄告诉你”。`
};

export const CAMPUS_TOUR_ROUTES: CampusTourRoute[] = [
    {
        id: 'route-freshman',
        title: '🎒 2026 新生报到通关路线',
        subtitle: '正门 ➔ 注册广场 ➔ 学院楼 ➔ 梅苑宿舍 ➔ 餐饮中心',
        icon: 'GraduationCap',
        color: 'from-amber-400 to-rose-400',
        duration: '约 25 分钟',
        description: '专为新生定制的一站式报到动线，带你提前走遍入校核验、学院报到、入驻宿舍与办卡全流程。',
        locationIds: ['loc-003', 'loc-006', 'loc-002', 'loc-004', 'loc-005']
    },
    {
        id: 'route-tech',
        title: '🔬 硬核工科与王牌科研路线',
        subtitle: '图书馆 ➔ 计算机大楼 ➔ 风洞国重实验室 ➔ 科技展厅',
        icon: 'Cpu',
        color: 'from-blue-500 to-indigo-600',
        duration: '约 30 分钟',
        description: '深度打卡广大计算机与AI算力中心、院士团队重点实验室，直击珠三角硬核科研就业实力。',
        locationIds: ['loc-001', 'loc-002', 'loc-009', 'loc-007']
    },
    {
        id: 'route-food',
        title: '🍜 舌尖上的广大·吃货生活路线',
        subtitle: '第一美食广场 ➔ 兰苑风味街 ➔ Gogo商业中心 ➔ 中心湖',
        icon: 'Utensils',
        color: 'from-orange-400 to-amber-500',
        duration: '约 20 分钟',
        description: '搜罗广大最地道好吃的食堂档口、清真风味与大学城网红美食街，吃货学子必备！',
        locationIds: ['loc-005', 'loc-004', 'loc-010', 'loc-008']
    },
    {
        id: 'route-scenery',
        title: '🌿 绝美生态风光打卡路线',
        subtitle: '正门大鼎 ➔ 中心湖黑天鹅 ➔ 演艺中心 ➔ 环校绿道',
        icon: 'Camera',
        color: 'from-emerald-400 to-teal-500',
        duration: '约 35 分钟',
        description: '穿梭中心湖畔、黑天鹅栖息地与现代演艺剧场，随手一拍都是广大明信片大片。',
        locationIds: ['loc-003', 'loc-008', 'loc-006', 'loc-007']
    }
];

export const DEFAULT_CAMPUS_LOCATIONS: CampusLocation[] = [
    {
        id: 'loc-001',
        name: '何世杰图书馆 (图文信息中心)',
        category: '教学科研',
        images: [
            'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800&auto=format&fit=crop'
        ],
        description: '广州大学地标建筑，楼高10层，藏书超200万册。全馆覆盖千兆WiFi与智能书架，配备单人沉浸自习舱、AI检索终端、考研研讨室与24小时自习区。',
        terms: ['24H自习室', '中心湖全景位', '静音沉浸舱', '电子文献库', '咖啡书吧'],
        coordinates: { x: 48, y: 38 },
        highlights: ['24小时恒温自习区', '智能人脸无感入馆', '6楼中心湖全景自习区'],
        openingHours: '周一至周日 06:30 - 22:30 (24H区全天开放)',
        liliNarrative: '学弟学妹看过来！这里就是咱们广大的学术心脏——何世杰图书馆！丽丽学姐悄悄告诉你，6楼靠近窗边的景观位无敌抢手，能一边自习一边俯瞰中心湖的夕阳。期末考试周记得早上7点半前就来抢座哦！',
        liliTips: [
            '6楼观景位视野最佳，直面中心湖晚霞',
            '期末期间24小时自习室不断电不熄灯',
            '馆内一楼有瑞幸咖啡和智能打印终端'
        ]
    },
    {
        id: 'loc-002',
        name: '计算机科学与网络空间安全学院大楼',
        category: '教学科研',
        images: [
            'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop'
        ],
        description: '国家级一流本科专业建设点与网络空间安全一级博士点大楼。配备万卡并行GPU超算集群、国家级数字孪生实验室及校企联合AI实训基地。',
        terms: ['国家级一流专业', '万卡超算中心', '腾讯网易基地', '院士创新团队', '学科竞赛大本营'],
        coordinates: { x: 38, y: 32 },
        highlights: ['ESI全球前1%学科', '院士领衔顶尖科研团队', '大湾区头部IT名企直通就业'],
        openingHours: '教学科研区全天开放',
        liliNarrative: '欢迎来到我们计算机学院的大本营！咱们学院有院士亲自带队，隔壁就是琶洲人工智能试验区。很多学长学姐大三就去腾讯、网易、字节实习啦，毕业薪资在中位数里绝对是第一梯队！',
        liliTips: [
            '实验室有24小时专属工位与空调',
            '大一下学期可以报名加入学生创新ACM战队',
            '学院每年举办大厂直通专场春招秋招会'
        ]
    },
    {
        id: 'loc-003',
        name: '广大正门与九鼎广场',
        category: '校园地标',
        images: [
            'https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=800&auto=format&fit=crop'
        ],
        description: '广州大学气势恢宏的主校门，正对大学城外环路，广场中央矗立象征博学笃行的巨型青铜九鼎，是每年开学迎新与毕业季合影打卡的必到地标。',
        terms: ['校门打卡', '九鼎雕塑', '迎新主站口', '交通枢纽'],
        coordinates: { x: 50, y: 82 },
        highlights: ['开学合影第一站', '直通大学城南地铁站接驳专线', '夜间景观喷泉灯光秀'],
        openingHours: '全天开放',
        liliNarrative: '这里是广大的正门啦！看到正中央那个沉稳庄重的九鼎了吗？每年9月开学迎新大巴都会直接开到这里，学长学姐会举着各个学院的牌子热情迎接你，帮你拎行李哦！',
        liliTips: [
            '校门口有直达大学城南地铁站的免费接驳电瓶车',
            '傍晚在九鼎前拍照光线最柔和出片'
        ]
    },
    {
        id: 'loc-004',
        name: '梅苑 / 兰苑学生公寓区',
        category: '生活住宿',
        images: [
            'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=800&auto=format&fit=crop'
        ],
        description: '现代化标准学生公寓园区，采用标准上床下桌设计。每间宿舍配备独立卫生间、干湿分离淋浴房、变频冷暖空调、千兆宽带网络与智能刷脸门禁。',
        terms: ['标准4人间', '独立卫浴', '冷暖空调', '上床下桌', '智能刷脸门禁', '24H热水'],
        coordinates: { x: 26, y: 55 },
        highlights: ['超大储物上床下桌', '24小时恒温热水', '楼下自带智能洗衣房与便利店'],
        openingHours: '门禁时间：06:00 - 23:30 (凭人脸通行)',
        liliNarrative: '大家最关心的宿舍来啦！咱们广大都是标准上床下桌，房间配有品牌冷暖空调、独立卫生间和24小时热水。楼下有刷脸门禁、洗衣机房和外卖自提柜，下楼5分钟就能买到夜宵，住起来超舒服！',
        liliTips: [
            '宿舍每层配备共享微波炉与直饮水机',
            '洗澡热水刷校园卡或手机NFC即可秒开',
            '阳台通风极佳，洗衣服一天就能干'
        ]
    },
    {
        id: 'loc-005',
        name: '第一美食广场 (梅苑食堂)',
        category: '餐饮美食',
        images: [
            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop'
        ],
        description: '三层大型综合美食广场，汇集广式烧腊、生滚靓粥、川湘小炒、东北水饺、清真专区及西式烘焙。采用无感智慧盘秒级结算，均价10-15元即可饱餐。',
        terms: ['广式烧腊', '清真风味', '自选称重', '智慧盘结算', '平价补贴'],
        coordinates: { x: 32, y: 50 },
        highlights: ['数百种全国风味档口', '智慧餐盘无感秒支付', '校方重点平价补贴食品安全放心'],
        openingHours: '早 06:30-09:00 | 午 10:30-13:30 | 晚 16:30-19:30 | 夜宵 20:00-22:30',
        liliNarrative: '吃货朋友们集合！梅苑一食堂二楼的广式深井烧鸭饭和石锅拌饭是丽丽学姐的最爱！三楼还有现煮砂锅粥和宵夜烤串，价格超级实惠，十几块钱就能吃到撑！',
        liliTips: [
            '二楼的广式烧腊和滑蛋饭中午12点最抢手',
            '一楼清真窗口的现拉大盘鸡拌面分量超足',
            '支持微信、支付宝、校园卡直接刷'
        ]
    },
    {
        id: 'loc-006',
        name: '大学城中心湖生态景观带',
        category: '校园地标',
        images: [
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800&auto=format&fit=crop'
        ],
        description: '广州大学紧邻的天然生态湖泊，湖水清澈碧波荡漾，栖息有优雅黑天鹅与水鸟，环湖建有漫步木栈道、阳光大草坪与落日观景台，是课后露营与放松圣地。',
        terms: ['中心湖', '黑天鹅栖息地', '落日栈道', '草坪野餐', '环湖慢跑'],
        coordinates: { x: 68, y: 38 },
        highlights: ['生态黑天鹅家族', '广州大学城最美日落观测点', '周末露营与吉他弹唱胜地'],
        openingHours: '全天开放',
        liliNarrative: '这里是中心湖！也是丽丽学姐平时没课最喜欢来散步的地方～湖里有咱们大学城的“团宠”黑天鹅，傍晚吹着晚风看落日倒映在湖面上，真的超级治愈！',
        liliTips: [
            '傍晚5点半到6点半是观赏绝美日落的最佳时间',
            '湖边草坪周末经常有社团举办露天音乐会'
        ]
    },
    {
        id: 'loc-007',
        name: '现代演艺中心与学生活动大楼',
        category: '校园地标',
        images: [
            'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?q=80&w=800&auto=format&fit=crop'
        ],
        description: '集千人多功能剧场、交响乐排练厅、舞蹈排练房、社团活动室及心理健康服务中心于一体的文化艺术地标，承办每年的迎新晚会、毕业歌会及高雅艺术巡演。',
        terms: ['千人剧场', '迎新晚会', '社团之家', '舞蹈排练房', '毕业歌会'],
        coordinates: { x: 62, y: 65 },
        highlights: ['专业级声光电剧场舞台', '百大社团活动大本营', '年度迎新视觉盛宴'],
        openingHours: '周一至周日 08:30 - 22:00',
        liliNarrative: '这里是演艺中心！咱们广大的迎新晚会、十佳歌手大赛和草地音乐节都是在这里举办的。里面有超大声光电剧场和社团排练室，文艺氛围超级浓厚！',
        liliTips: [
            '每年十佳歌手总决赛门票非常抢手，记得关注学生会抢票通知',
            '地下一层有免费开放的舞蹈形体房'
        ]
    },
    {
        id: 'loc-008',
        name: '广大综合体育馆与恒温游泳池',
        category: '体育休闲',
        images: [
            'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800&auto=format&fit=crop'
        ],
        description: '高规格现代体育综合体，包含标准50米8泳道室内恒温游泳馆、专业实木地板篮球馆、羽毛球馆、力量健身房及标准400米塑胶跑道田径场。',
        terms: ['恒温游泳馆', '室内篮球场', '健身房', '羽毛球场', '体测中心', '塑胶跑道'],
        coordinates: { x: 74, y: 58 },
        highlights: ['国家标准50米恒温游泳池', '全套专业力量器械健身房', '全天候室内运动场地'],
        openingHours: '周一至周日 08:00 - 22:00',
        liliNarrative: '热爱运动的同学看这里！咱们广大的体育馆拥有标准50米室内恒温游泳池和木地板羽毛球场，水质非常清澈，冬天游也完全不冷。上体育课或者课后打球来这儿准没错！',
        liliTips: [
            '大一修游泳学分可以直接在恒温馆上课，零基础也能学会',
            '羽毛球场地可以通过智慧校园APP提前预约'
        ]
    },
    {
        id: 'loc-009',
        name: '土木与工程抗震实验大楼 (风洞实验室)',
        category: '教学科研',
        images: [
            'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=800&auto=format&fit=crop'
        ],
        description: '广大传统王牌工科学科大楼，拥有院士领衔的国家级工程重点实验室、大型边界层风洞实验装置及地震模拟振动台，深度参与大湾区港珠澳大桥等世纪工程科研攻关。',
        terms: ['院士重点实验室', '大型风洞实验', '土木工程王牌', '结构抗震研究', '大国工程攻关'],
        coordinates: { x: 42, y: 22 },
        highlights: ['院士领衔国家重点实验室', '亚洲领先的大型风洞试验段', '港珠澳大桥技术支撑单位'],
        openingHours: '教学科研区域',
        liliNarrative: '这就是名震华南的广大土木与风洞实验大楼！咱们广大的土木有院士坐镇和国家级重点实验室，像港珠澳大桥、广州塔等重大工程都有咱们老师和学长学姐参与的技术攻关！',
        liliTips: [
            '大楼内陈列着众多桥梁与高层抗震微缩模型',
            '土木专业每年有很多建筑央企直接来大楼内开专场招聘'
        ]
    },
    {
        id: 'loc-010',
        name: '广大商业中心 & Gogo 新天地',
        category: '餐饮美食',
        images: [
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop'
        ],
        description: '紧邻广大生活区的大学城核心商业综合体，汇集电影院、各类连锁餐饮品牌、茶饮奶茶街、数码专卖、服装商场及大型生活超市，是周末聚餐娱乐的枢纽。',
        terms: ['商业步行街', '电影院', '奶茶一条街', '大型超市', '数码维修', '周末聚会'],
        coordinates: { x: 18, y: 68 },
        highlights: ['出宿舍步行3分钟直达', '汇集各大网红茶饮餐饮品牌', '大学城最热闹的人气商圈'],
        openingHours: '全天营业 (商场 10:00 - 22:30)',
        liliNarrative: '出宿舍门走几分钟就是咱们广大人最爱的“广大商业中心”和 Gogo 新天地啦！喜茶、霸王茶姬、海底捞、电影院应有尽有，周末想和舍友聚餐看电影，下楼就能搞定！',
        liliTips: [
            '各类快递驿站和数码维修点都在商圈一层',
            '晚上商圈外围有很多特色宵夜档'
        ]
    }
];
