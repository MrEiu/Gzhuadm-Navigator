import { CampusLocation, CampusTourRoute } from '../types';

export const LILI_GUIDE_AGENT = {
    name: '丽丽学姐',
    fullName: '广大校园伴游向导 · 丽丽 (Lili)',
    role: '计算机学院大三在读 / 广大校园向导团团长',
    avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSVj3_GxALNWCvvYihiQsgv2KEhImtc73CpQywRMqdv5w&s=10',
    welcomeSpeech: '嗨～学弟学妹好呀！我是你们的广大伴游学姐丽丽！今天由我带大家漫游广大大学城校区。点击地图上的任意地标或者选择上方的特色路线，我来为你语音解说每一个角落的故事与避坑小秘密～',
    prompt: `你叫“丽丽”，是广州大学计算机与网络空间安全学院大三的女大学生，同时也是学校的官方向导团团长。你的性格活泼开朗、元气满满、大实话、接地气，对广州大学大学城校区和黄埔校区了如指掌。你非常乐于给未来的学弟学妹和家长介绍广大的真实就读体验（自习室占座攻略、食堂招牌菜、宿舍空调热水、专业就业前景等）。你的语言风格亲切自然，善用“学弟学妹”、“我跟你说呀”、“悄悄告诉你”。`
};

export const CAMPUS_TOUR_ROUTES: CampusTourRoute[] = [
    {
        id: 'route-freshman',
        title: '🎒 新生报到通关动线',
        subtitle: '正门天桥 ➔ 行政东楼 ➔ 文清楼 ➔ 梅苑/兰苑 ➔ 广大商业中心',
        icon: 'GraduationCap',
        color: 'from-amber-400 to-rose-400',
        duration: '约 25 分钟',
        description: '专为新生定制的一站式报到动线，带你走遍入校注册、学院报到、宿舍入住与生活采购全流程。',
        locationIds: ['loc-bridge-1', 'loc-admin-east', 'loc-wenqing', 'loc-mei-dining', 'loc-commercial']
    },
    {
        id: 'route-tech',
        title: '🔬 硬核工科与科研王牌线',
        subtitle: '图书馆 ➔ 计算机实验楼 ➔ 工程楼 ➔ 生化实验楼 ➔ 电子信息楼',
        icon: 'Cpu',
        color: 'from-blue-500 to-indigo-600',
        duration: '约 30 分钟',
        description: '深度打卡广大计算机超算实验室、风洞工程实验室、生化与电子信息实验大楼。',
        locationIds: ['loc-library', 'loc-cs-lab', 'loc-eng-south', 'loc-biochem-lab', 'loc-elec-info']
    },
    {
        id: 'route-food',
        title: '🍜 舌尖上的广大·吃货生活线',
        subtitle: '广大商业中心 ➔ 菊苑饭堂 ➔ 兰苑饭堂 ➔ 梅苑饭堂',
        icon: 'Utensils',
        color: 'from-orange-400 to-amber-500',
        duration: '约 20 分钟',
        description: '集结全校三大特色学生食堂与大学城最繁华的广大商业中心，吃货学子必备！',
        locationIds: ['loc-commercial', 'loc-ju-dining', 'loc-lan-dining', 'loc-mei-dining']
    },
    {
        id: 'route-scenery',
        title: '🌿 中心湖与演艺风光线',
        subtitle: '图书馆 ➔ 中心湖生态区 ➔ 何世杰体育馆 ➔ 演艺中心 ➔ 南区运动场',
        icon: 'Camera',
        color: 'from-emerald-400 to-teal-500',
        duration: '约 35 分钟',
        description: '穿梭中心湖畔、何世杰体育馆与现代演艺剧场，随手一拍都是广大明信片大片。',
        locationIds: ['loc-library', 'loc-he-gym', 'loc-perf-center', 'loc-south-sports']
    }
];

export const DEFAULT_CAMPUS_LOCATIONS: CampusLocation[] = [
    // --- 1. 核心地标与公共建筑组团 ---
    {
        id: 'loc-library',
        name: '何世杰图书馆 (主馆)',
        category: '教学科研',
        images: [
            'https://img1.baidu.com/it/u=3263872702,1907683674&fm=253&fmt=auto&app=138&f=JPEG?w=508&h=500',
            'https://img2.baidu.com/it/u=568594630,3588639188&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=618'
        ],
        description: '广州大学地标建筑，楼高10层，建筑面积达4.5万平方米，藏书超200万册。全馆覆盖千兆高速WiFi与智能书架，配备单人沉浸自习舱、AI检索终端、考研研讨室与24小时自习区。',
        terms: ['24H自习室', '中心湖全景位', '静音沉浸舱', '电子文献库', '咖啡书吧'],
        coordinates: { x: 45.0, y: 34.5 },
        highlights: ['24小时恒温自习区', '智能人脸无感入馆', '6楼中心湖全景景观自习区'],
        openingHours: '周一至周日 06:30 - 22:30 (24H区全天开放)',
        liliNarrative: '学弟学妹看过来！这里就是咱们广大的学术心脏——何世杰图书馆！丽丽学姐悄悄告诉你，6楼靠近窗边的景观位无敌抢手，能一边自习一边俯瞰中心湖的夕阳。期末考试周记得早上7点半前就来抢座哦！',
        liliTips: [
            '6楼观景位视野最佳，直面中心湖晚霞与黑天鹅',
            '期末期间24小时自习室不断电不熄灯',
            '馆内一楼有瑞幸咖啡和智能自助打印终端'
        ]
    },
    {
        id: 'loc-library-annex',
        name: '图书馆附楼',
        category: '教学科研',
        images: [
            'https://img2.baidu.com/it/u=568594630,3588639188&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=618',
            'https://img1.baidu.com/it/u=3263872702,1907683674&fm=253&fmt=auto&app=138&f=JPEG?w=508&h=500'
        ],
        description: '紧邻何世杰图书馆南侧，设有学术报告厅、特藏文献阅览室及校史文化长廊。',
        terms: ['学术报告厅', '特藏阅览室', '校史长廊'],
        coordinates: { x: 44.5, y: 39.5 },
        highlights: ['学术交流研讨中心', '校史与文化特藏库'],
        openingHours: '周一至周五 08:30 - 17:30',
        liliNarrative: '图书馆附楼经常举办院士讲座和学术交流会，一楼的校史长廊很适合新生来快速了解广大的发展历程！',
        liliTips: ['楼内学术报告厅冷气较足，建议带件薄外套']
    },
    {
        id: 'loc-he-gym',
        name: '何世杰体育馆',
        category: '体育休闲',
        images: [
            'https://img1.baidu.com/it/u=1549027559,2785738242&fm=253&fmt=auto&app=138&f=JPEG?w=890&h=500'
        ],
        description: '学校主体育馆，拥有高规格室内实木地板篮球馆、羽毛球馆、乒乓球室与健身力量房，承办各类大型CUBA大学联赛与校运会室内赛事。',
        terms: ['室内篮球馆', '羽毛球场', '乒乓球室', '力量健身房', 'CUBA主场'],
        coordinates: { x: 57.5, y: 24.0 },
        highlights: ['专业比赛级实木地板', '室内全空调运动环境', '大学城顶级篮球主场'],
        openingHours: '周一至周日 08:00 - 22:00',
        liliNarrative: '这就是何世杰体育馆！室内羽毛球场和篮球场常年火爆，木地板弹性非常好。冬天或者下雨天运动来这里最舒服啦！',
        liliTips: [
            '羽毛球场地可以通过智慧校园APP提前3天预约',
            '馆内有自动售水机和更衣淋浴间'
        ]
    },
    {
        id: 'loc-perf-center',
        name: '演艺中心',
        category: '校园地标',
        images: [
            'https://img2.baidu.com/it/u=4021462537,4110862131&fm=253&fmt=auto&app=138&f=GIF?w=551&h=418'
        ],
        description: '千人专业级多功能艺术大剧场，配备专业舞台声光电系统、交响乐排练厅与舞蹈排练房，是每年迎新晚会、十佳歌手大赛及毕业歌会的核心主场。',
        terms: ['千人剧场', '迎新晚会', '十佳歌手', '毕业歌会', '艺术展演'],
        coordinates: { x: 63.5, y: 71.0 },
        highlights: ['专业声光电巨幕舞台', '百大社团展演圣地', '年度迎新晚会主会场'],
        openingHours: '周一至周日 08:30 - 22:00',
        liliNarrative: '这里是演艺中心！咱们广大的迎新晚会、十佳歌手总决赛都在这里办。舞台灯光音效超级震撼，每年的门票都要拼手速抢哦！',
        liliTips: [
            '十佳歌手抢票提前关注校学生会官方公众号',
            '地下一层有面向学生免费开放的舞蹈形体房'
        ]
    },

    // --- 2. 理工与科研教学组团 (西北区) ---
    {
        id: 'loc-cs-lab',
        name: '计算机实验楼',
        category: '教学科研',
        images: [
            'https://img2.baidu.com/it/u=468805999,730018308&fm=253&fmt=auto&app=138&f=JPEG?w=332&h=500'
        ],
        description: '计算机科学与网络空间安全学院核心实验楼。部署万卡并行GPU集群、国家级数字孪生工程实验室、机器人智能交互工坊及校企联合AI实训基地。',
        terms: ['国家级一流专业', '万卡超算集群', '腾讯网易基地', '网络安全实验', 'ACM战队'],
        coordinates: { x: 34.0, y: 12.5 },
        highlights: ['国家一流本科专业基地', '院士领衔顶尖科研团队', '大湾区头部IT名企直通实习'],
        openingHours: '教学科研区全天开放',
        liliNarrative: '欢迎来到我们计算机学院的大本营！咱们学院有院士亲自带队，实验室配有万卡GPU算力集群。很多学长学姐大三就去腾讯、网易实习啦！',
        liliTips: [
            '专业实验室有24小时专属工位与空调',
            '大一下学期可以报名加入学生创新ACM算法战队'
        ]
    },
    {
        id: 'loc-eng-south',
        name: '工程南楼',
        category: '教学科研',
        images: [
            'https://img2.baidu.com/it/u=468805999,730018308&fm=253&fmt=auto&app=138&f=JPEG?w=332&h=500'
        ],
        description: '机械与电气工程学院教学科研大楼，设有先进智能制造实验室、无人机控制工坊及机器人创客空间。',
        terms: ['智能制造', '电气工程', '机器人创客', '无人机实验'],
        coordinates: { x: 41.5, y: 11.0 },
        highlights: ['先进数控与机器人加工中心', '全国大学生智能车竞赛基地'],
        openingHours: '周一至周日 07:00 - 22:30',
        liliNarrative: '工程南楼是机电和自动化同学的天堂！里面经常能看到学长学姐在调试无人机和四足机器人，科技感拉满！',
        liliTips: ['一楼创客工坊对全校对机器人感兴趣的同学开放招新']
    },
    {
        id: 'loc-eng-north',
        name: '工程北楼 (风洞抗震实验室)',
        category: '教学科研',
        images: [
            'https://img2.baidu.com/it/u=468805999,730018308&fm=253&fmt=auto&app=138&f=JPEG?w=332&h=500'
        ],
        description: '土木工程国家重点学科大楼，拥有大型边界层风洞实验装置及地震模拟振动台，深度参与港珠澳大桥、广州塔等重大世纪工程攻关。',
        terms: ['土木工程王牌', '大型风洞实验', '院士重点实验室', '抗震试验台'],
        coordinates: { x: 49.0, y: 10.5 },
        highlights: ['亚洲领先的大型风洞试验段', '院士领衔国家重点实验室', '大国世纪工程技术支撑'],
        openingHours: '科研教学区域',
        liliNarrative: '这就是名震华南的广大工程风洞大楼！港珠澳大桥等重大工程都有咱们土木学院院士团队参与的技术攻关，王牌硬实力！',
        liliTips: ['大楼内陈列着各类著名桥梁与高层建筑微缩抗震模型']
    },
    {
        id: 'loc-biochem-lab',
        name: '生化实验楼',
        category: '教学科研',
        images: [
            'https://img2.baidu.com/it/u=468805999,730018308&fm=253&fmt=auto&app=138&f=JPEG?w=332&h=500'
        ],
        description: '化学化工学院与生命科学学院大型实验大楼，配置超高分辨质谱仪、流式细胞仪等先进分析测试仪器。',
        terms: ['化学实验', '生物医药', '精细化工', '现代分析测试中心'],
        coordinates: { x: 56.5, y: 13.0 },
        highlights: ['广东省重点实验室', '国家级实验教学示范中心'],
        openingHours: '周一至周日 07:30 - 22:00',
        liliNarrative: '生化实验楼里都是穿白大褂的科研大佬！楼内的分析测试中心设备非常先进，生物制药和新材料方向的科研氛围很浓厚！',
        liliTips: ['进入实验室必须穿实验服佩戴护目镜']
    },
    {
        id: 'loc-sci-north',
        name: '理科北楼',
        category: '教学科研',
        images: [
            'https://img2.baidu.com/it/u=468805999,730018308&fm=253&fmt=auto&app=138&f=JPEG?w=332&h=500'
        ],
        description: '数学与信息科学学院及基础理科核心教学楼，配备数十间多媒体智慧微格教室。',
        terms: ['应用数学', '微格教室', '大数据统计', '考研自习'],
        coordinates: { x: 27.5, y: 17.5 },
        highlights: ['基础理学教学基地', '智慧互动多媒体大课室'],
        openingHours: '周一至周日 07:00 - 22:00',
        liliNarrative: '理科北楼是大家上高等数学、线性代数和概率论的主要阵地，课室非常宽敞明亮！',
        liliTips: ['没课的时候空教室均可作为临时自习室使用']
    },
    {
        id: 'loc-sci-south',
        name: '理科南楼',
        category: '教学科研',
        images: [
            'https://img2.baidu.com/it/u=468805999,730018308&fm=253&fmt=auto&app=138&f=JPEG?w=332&h=500'
        ],
        description: '物理与材料科学学院大楼，建有近代物理实验室与新型光电功能材料研究中心。',
        terms: ['应用物理', '光电材料', '材料科学', '物理实验'],
        coordinates: { x: 21.5, y: 22.5 },
        highlights: ['光电材料工程技术研究中心', '省级物理实验教学中心'],
        openingHours: '周一至周日 07:00 - 22:00',
        liliNarrative: '理科南楼有超多好玩的大学物理实验，比如激光干涉、全息照相，老师讲课通俗易懂！',
        liliTips: ['大一的大学物理实验一定要提前预习写好实验报告哦']
    },
    {
        id: 'loc-elec-info',
        name: '电子信息楼',
        category: '教学科研',
        images: [
            'https://img2.baidu.com/it/u=468805999,730018308&fm=253&fmt=auto&app=138&f=JPEG?w=332&h=500'
        ],
        description: '电子与通信工程学院教学大楼，涵盖5G/6G通信、集成电路微电子设计与物联网传感实验室。',
        terms: ['通信工程', '集成电路', '芯片设计', '物联网通信'],
        coordinates: { x: 16.0, y: 29.0 },
        highlights: ['国家级微电子集成电路实训平台', '华为5G产教融合基地'],
        openingHours: '周一至周日 07:00 - 22:30',
        liliNarrative: '电子信息楼与华为、中兴有很多校企联合项目，通信和集成电路方向的就业率一直保持在顶尖水平！',
        liliTips: ['学院每年举办电子设计大赛，得奖对保研加分超有用']
    },
    {
        id: 'loc-sci-lab',
        name: '理学实验楼',
        category: '教学科研',
        images: [
            'https://img2.baidu.com/it/u=468805999,730018308&fm=253&fmt=auto&app=138&f=JPEG?w=332&h=500'
        ],
        description: '综合理学基础实验中心，承担全校本科生基础化学、物理与生命科学通识实验教学。',
        terms: ['通识实验', '理学示范中心', '化学仪器'],
        coordinates: { x: 19.5, y: 37.0 },
        highlights: ['国家级实验教学示范中心', '全校通识实验枢纽'],
        openingHours: '周一至周五 08:00 - 21:30',
        liliNarrative: '全校理工科同学大一基本都会来理学实验楼上大物实验和化学实验，环境很宽敞！',
        liliTips: ['楼内有直饮水机，记得自备水杯']
    },

    // --- 3. 人文社科与行政组团 (西南区) ---
    {
        id: 'loc-admin-west',
        name: '行政西楼',
        category: '校园地标',
        images: [
            'https://img2.baidu.com/it/u=468805999,730018308&fm=253&fmt=auto&app=138&f=JPEG?w=332&h=500'
        ],
        description: '校党委、校长办公室、财务处、教务处等校级职能部门办公大楼。',
        terms: ['教务处', '财务处', '校长办公室', '综合服务大厅'],
        coordinates: { x: 27.5, y: 41.5 },
        highlights: ['一站式师生事务综合服务大厅', '校级行政指挥中枢'],
        openingHours: '工作日 08:30 - 12:00, 13:30 - 17:00',
        liliNarrative: '行政西楼一楼有“一站式师生服务大厅”，成绩单自助打印机、学籍证明盖章都在这里办理！',
        liliTips: ['一楼自助打印机支持刷校园卡或身份证24小时自助打印成绩单']
    },
    {
        id: 'loc-admin-east',
        name: '行政东楼',
        category: '校园地标',
        images: [
            'https://img2.baidu.com/it/u=468805999,730018308&fm=253&fmt=auto&app=138&f=JPEG?w=332&h=500'
        ],
        description: '学生工作处、招生就业工作处、团委及研究生院办公大楼。',
        terms: ['招生办', '就业指导中心', '学生处', '校团委', '奖助学金办理'],
        coordinates: { x: 38.0, y: 47.5 },
        highlights: ['本科招生与就业咨询中心', '学生创新创业孵化基地'],
        openingHours: '工作日 08:30 - 12:00, 13:30 - 17:00',
        liliNarrative: '找招生办老师咨询或者办理奖助学金、三方就业协议，都要来行政东楼哦！',
        liliTips: ['楼内有毕业生就业指导专窗，提供简历修改和模拟面试指导']
    },
    {
        id: 'loc-wenqing',
        name: '文清楼',
        category: '教学科研',
        images: [
            'https://img2.baidu.com/it/u=468805999,730018308&fm=253&fmt=auto&app=138&f=JPEG?w=332&h=500'
        ],
        description: '人文社科公共教学核心大楼，拥有数十间阶梯多媒体大教室与智慧考场。',
        terms: ['公共教学楼', '阶梯课室', '思政大课', '期末考场'],
        coordinates: { x: 40.5, y: 53.0 },
        highlights: ['千人阶梯学术大课室', '全空调智慧多媒体设施'],
        openingHours: '周一至周日 07:00 - 22:00',
        liliNarrative: '文清楼课室超级多，大家的通识选修课和思政大课基本都在文清楼上，通风采光很好！',
        liliTips: ['课间换教室走廊较宽敞，楼下有自动饮料贩卖机']
    },
    {
        id: 'loc-wenxin',
        name: '文新楼',
        category: '教学科研',
        images: [
            'https://img2.baidu.com/it/u=468805999,730018308&fm=253&fmt=auto&app=138&f=JPEG?w=332&h=500'
        ],
        description: '新闻与传播学院、外国语学院大楼，建有全景4K演播厅与同声传译实训室。',
        terms: ['新传学院', '4K演播厅', '同声传译', '融媒体中心'],
        coordinates: { x: 46.0, y: 57.5 },
        highlights: ['省部级融媒体实验教学示范中心', '国际标准化同传会议室'],
        openingHours: '周一至周日 07:30 - 22:00',
        liliNarrative: '文新楼是新传和外语帅哥美女云集的地方！里面有超棒的虚拟4K演播厅和录音棚！',
        liliTips: ['新传学院每年举办微电影节，展映很多优秀学生作品']
    },
    {
        id: 'loc-wenyi',
        name: '文逸楼',
        category: '教学科研',
        images: [
            'https://img2.baidu.com/it/u=468805999,730018308&fm=253&fmt=auto&app=138&f=JPEG?w=332&h=500'
        ],
        description: '教育学院与教师教育国家级实验教学示范中心大楼，培养全省卓越中小学师资。',
        terms: ['师范教育', '教师技能微格室', '书法教室', '心理咨询实验室'],
        coordinates: { x: 51.5, y: 63.5 },
        highlights: ['广东省师范生技能实训中心', '全真三字一话教学实训室'],
        openingHours: '周一至周日 07:30 - 22:00',
        liliNarrative: '广大师范类专业在广东认可度极高！文逸楼里有专门的板书书法教室和教师技能模拟考场！',
        liliTips: ['想考教师资格证的同学可以多来文逸楼微格教室练讲课']
    },
    {
        id: 'loc-wenjun-west',
        name: '文俊西楼',
        category: '教学科研',
        images: [
            'https://img2.baidu.com/it/u=468805999,730018308&fm=253&fmt=auto&app=138&f=JPEG?w=332&h=500'
        ],
        description: '经济与统计学院大楼，拥有金融大数据模拟实验室与量化投资实训室。',
        terms: ['经济学院', '金融工程', '量化投资', '统计大数据'],
        coordinates: { x: 50.5, y: 53.0 },
        highlights: ['彭博Bloomberg金融终端实验室', '大湾区金融数据研究中心'],
        openingHours: '周一至周日 07:30 - 22:00',
        liliNarrative: '文俊西楼有彭博金融终端实验室，经管和金融工程同学可以在这里实时追踪全球股市和期货数据！',
        liliTips: ['金融终端需要提前跟指导老师申请账号上机']
    },
    {
        id: 'loc-wenjun-east',
        name: '文俊东楼',
        category: '教学科研',
        images: [
            'https://img2.baidu.com/it/u=468805999,730018308&fm=253&fmt=auto&app=138&f=JPEG?w=332&h=500'
        ],
        description: '管理学院大楼，建有现代物流供应链仿真中心、跨境电商实训基地及ERP沙盘演练室。',
        terms: ['管理学院', '工商管理', '物流仿真', '电商实训', 'ERP沙盘'],
        coordinates: { x: 55.5, y: 58.0 },
        highlights: ['大湾区现代物流与供应链科研基地', '国家级管理实验教学示范中心'],
        openingHours: '周一至周日 07:30 - 22:00',
        liliNarrative: '文俊东楼经常举办企业模拟经营沙盘大赛，紧邻二号天桥，去生活区和食堂只需走1分钟！',
        liliTips: ['下课过二号天桥直接就到梅苑一食堂，干饭无缝衔接']
    },

    // --- 4. 商业、餐饮与生活服务组团 (生活区) ---
    {
        id: 'loc-commercial',
        name: '广大商业中心 (Gogo新天地)',
        category: '餐饮美食',
        images: [
            'https://img2.baidu.com/it/u=440549594,449543732&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=667',
            'https://img2.baidu.com/it/u=788041614,1957148242&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=653'
        ],
        description: '大学城核心商业综合体，汇聚各大连锁餐饮品牌、茶饮奶茶街、大型生活超市、电影院、数码专卖及快递驿站。',
        terms: ['商业中心', '奶茶一条街', '大型超市', '电影院', '周末聚会', '快递总站'],
        coordinates: { x: 61.5, y: 41.0 },
        highlights: ['出宿舍步行2分钟直达', '大学城最热闹的人气商业地标', '喜茶霸王茶姬各大品牌齐全'],
        openingHours: '全天营业 (商场 10:00 - 22:30)',
        liliNarrative: '出宿舍门走两步就是咱们广大人最爱的商业中心啦！喜茶、海底捞、电影院应有尽有，周末和舍友聚餐看电影下楼就搞定！',
        liliTips: [
            '各类快递驿站和数码维修点都在商圈一层',
            '晚上商圈外围有很多特色宵夜档和糖水铺'
        ]
    },
    {
        id: 'loc-ju-dining',
        name: '菊苑饭堂',
        category: '餐饮美食',
        images: [
            'https://img2.baidu.com/it/u=788041614,1957148242&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=653'
        ],
        description: '菊苑生活区配套餐厅，主打精致粤式茶点、自选快餐、现煲老火汤及面食风味。',
        terms: ['菊苑食堂', '粤式早茶', '老火靓汤', '平价实惠'],
        coordinates: { x: 72.5, y: 40.0 },
        highlights: ['早晨提供现蒸广式虾饺肠粉', '自选称重菜品丰富营养健康'],
        openingHours: '早 06:30-09:00 | 午 10:30-13:30 | 晚 16:30-19:30',
        liliNarrative: '菊苑饭堂的广式肠粉和生滚及第粥很正宗！住在B21-B25的同学早上走下楼就能喝到暖暖的靓汤～',
        liliTips: ['早上8点前肠粉档口人较少，不用排队']
    },
    {
        id: 'loc-lan-dining',
        name: '兰苑饭堂',
        category: '餐饮美食',
        images: [
            'https://img2.baidu.com/it/u=788041614,1957148242&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=653'
        ],
        description: '兰苑生活区大型餐厅，集合川湘重口味、麻辣香锅、东北烤盘饭及特色水饺。',
        terms: ['兰苑食堂', '麻辣香锅', '川湘风味', '烤盘饭', '水饺'],
        coordinates: { x: 84.0, y: 50.5 },
        highlights: ['川湘风味特色浓郁', '夜间提供铁板烧与夜宵砂锅面'],
        openingHours: '早 06:30-09:00 | 午 10:30-13:30 | 晚 16:30-19:30 | 夜宵 20:00-22:30',
        liliNarrative: '喜欢吃辣的宝子一定要来兰苑饭堂！二楼的自选麻辣香锅和石锅拌饭绝绝子，香气扑鼻！',
        liliTips: ['麻辣香锅可以微辣，分量很实在']
    },
    {
        id: 'loc-mei-dining',
        name: '梅苑饭堂 (第一美食广场)',
        category: '餐饮美食',
        images: [
            'https://img2.baidu.com/it/u=788041614,1957148242&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=653'
        ],
        description: '三层大型综合美食广场，拥有广式深井烧腊、清真特色窗口、西式铁板牛排及自选快餐。',
        terms: ['梅苑一食堂', '广式深井烧鸭', '清真专区', '智慧盘秒付', '平价补贴'],
        coordinates: { x: 82.5, y: 69.0 },
        highlights: ['全校规模最大美食广场', '清真国家认证风味窗口', '智慧餐盘秒级无感结算'],
        openingHours: '早 06:30-09:00 | 午 10:30-13:30 | 晚 16:30-19:30 | 夜宵 20:00-22:30',
        liliNarrative: '吃货朋友们集合！梅苑一食堂二楼的深井烧鸭饭和清真大盘鸡是全校公认的招牌，十几块钱吃到撑！',
        liliTips: [
            '中午12点二楼烧腊窗口排队最长，建议错峰11点40分去',
            '支持微信、支付宝、校园卡直接刷'
        ]
    },
    {
        id: 'loc-clinic',
        name: '门诊部 (校医院)',
        category: '生活住宿',
        images: [
            'https://img2.baidu.com/it/u=660521641,3397693214&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=640'
        ],
        description: '广州大学校医院，设有内科、外科、眼科、口腔科、预防保健科及24小时急诊药房，大学生医保定点直报。',
        terms: ['校医院', '24H急诊', '大学生医保', '口腔科', '体检中心'],
        coordinates: { x: 71.5, y: 53.0 },
        highlights: ['24小时值班急诊', '大学生医保门诊统筹直报90%'],
        openingHours: '门诊 08:00-12:00, 14:00-17:30 (急诊24小时)',
        liliNarrative: '门诊部就在宿舍区正中心！平时有个头疼脑热或者换药直接刷医保卡，报销比例很高，医生护士都很耐心！',
        liliTips: ['就医带好身份证和校园卡，挂号费和药费自动享受医保结算']
    },
    {
        id: 'loc-rongxuan',
        name: '榕轩 (教师与留学生公寓)',
        category: '生活住宿',
        images: [
            'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=800&auto=format&fit=crop'
        ],
        description: '国际学生学者交流中心及高层次人才公寓，环境静谧绿树成荫。',
        terms: ['留学生公寓', '专家楼', '国际交流中心'],
        coordinates: { x: 84.0, y: 60.0 },
        highlights: ['国际文化交流活动中心', '花园式静谧居住环境'],
        openingHours: '公寓管理区域',
        liliNarrative: '榕轩主要住着来自全球各地的留学生小伙伴和外教老师，周围种满了大榕树，环境非常优美！',
        liliTips: ['每年国际文化节在榕轩前广场举行，能品尝到各国特色小吃']
    },

    // --- 5. 体育场馆与运动区 ---
    {
        id: 'loc-north-sports',
        name: '北区运动场',
        category: '体育休闲',
        images: [
            'https://img1.baidu.com/it/u=1549027559,2785738242&fm=253&fmt=auto&app=138&f=JPEG?w=890&h=500'
        ],
        description: '标准400米塑胶跑道田径场与天然草坪足球场，配置高杆夜间照明灯光与观众看台。',
        terms: ['400米塑胶跑道', '足球场', '夜跑圣地', '体测场地'],
        coordinates: { x: 71.0, y: 18.0 },
        highlights: ['专业级缓震塑胶跑道', '夜间大功率聚光照明', '每晚千人夜跑打卡点'],
        openingHours: '全天开放 (夜间照明开至 22:30)',
        liliNarrative: '北区田径场每晚都超级热闹！跑道弹性很好，晚上有大灯照明，吹着晚风夜跑听歌非常解压！',
        liliTips: ['体测50米和1000米/800米通常都在北区田径场进行']
    },
    {
        id: 'loc-south-sports',
        name: '南区运动场',
        category: '体育休闲',
        images: [
            'https://img1.baidu.com/it/u=1549027559,2785738242&fm=253&fmt=auto&app=138&f=JPEG?w=890&h=500'
        ],
        description: '紧邻演艺中心的南部综合体育场，包含网球场群、室外排球场、篮球场及标准田径场。',
        terms: ['网球场', '室外篮球场', '排球场', '校运会主场'],
        coordinates: { x: 71.0, y: 85.0 },
        highlights: ['专业标准网球场', '全运会级别田径场地'],
        openingHours: '周一至周日 06:30 - 22:00',
        liliNarrative: '南区运动场靠近梅苑宿舍，网球场和排球场都在这里，选修网球课的同学下课直接走回宿舍超方便！',
        liliTips: ['网球场晚上需提前在场地管理处登记预约']
    },

    // --- 6. 交通天桥与标志设施 ---
    {
        id: 'loc-bridge-1',
        name: '广大一号天桥',
        category: '校园地标',
        images: [
            'https://img1.baidu.com/it/u=1324952609,2545213543&fm=253&fmt=auto&app=138&f=JPEG?w=499&h=334'
        ],
        description: '连接教学区何世杰图书馆与生活区广大商业中心的标志性景观天桥，横跨大学城中环西路。',
        terms: ['一号天桥', '中环西路跨线', '教学生活直通'],
        coordinates: { x: 51.5, y: 43.5 },
        highlights: ['人车分流安全通道', '下课高峰期核心交通动脉'],
        openingHours: '全天通行',
        liliNarrative: '广大一号天桥连接图书馆和广大商业中心！走过天桥就能从自习室一秒切换到奶茶美食街！',
        liliTips: ['天桥设有无障碍缓坡，推自行车或行李箱非常省力']
    },
    {
        id: 'loc-bridge-2',
        name: '广大二号天桥',
        category: '校园地标',
        images: [
            'https://img1.baidu.com/it/u=1324952609,2545213543&fm=253&fmt=auto&app=138&f=JPEG?w=499&h=334'
        ],
        description: '连接文俊东楼与梅苑一食堂的景观天桥，是文科教学区通往宿舍区与食堂的核心枢纽。',
        terms: ['二号天桥', '文俊楼天桥', '干饭快速通道'],
        coordinates: { x: 61.0, y: 57.5 },
        highlights: ['文科下课干饭黄金通道', '安全跨越大学城中环西路'],
        openingHours: '全天通行',
        liliNarrative: '在文俊楼和文逸楼上课的同学下课直接冲上二号天桥，2分钟就能冲进梅苑一食堂排队抢烧腊！',
        liliTips: ['中午12点下课人流最大，注意靠右行走']
    }
];
