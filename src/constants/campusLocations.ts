import { CampusLocation } from '../types';

export const DEFAULT_CAMPUS_LOCATIONS: CampusLocation[] = [
    {
        id: 'loc-001',
        name: '智慧图文信息中心 (主图书馆)',
        category: '教学科研',
        images: [
            'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800&auto=format&fit=crop'
        ],
        description: '全校地标建筑，楼高10层，建筑面积达4.5万平方米。拥有藏书超200万册，全馆覆盖高速WiFi与智能书架，配备单人沉浸自习舱、AI检索终端、研讨室与24小时不打烊自习区。',
        terms: ['24小时自习室', '海量电子文献', '智能书架', '研讨室预约', '静音沉浸舱', '咖啡图书吧'],
        coordinates: { x: 48, y: 38 },
        highlights: ['24H开放自习区', '智能人脸入馆', '沉浸式静音舱', '全景落地窗景观'],
        openingHours: '周一至周日 06:30 - 23:00 (24H区全天开放)'
    },
    {
        id: 'loc-002',
        name: '人工智能与算力中心大楼',
        category: '教学科研',
        images: [
            'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop'
        ],
        description: '计算机学院与软件学院科研大楼，部署有万卡并行集群超级计算中心、国家级数字孪生工程实验室、机器人智能交互工坊以及多个校企联合AI实验室。',
        terms: ['AI实验室', '高性能算力', '创新创业基地', '机器人工坊', '校企联合实验室', '学科竞赛基地'],
        coordinates: { x: 28, y: 46 },
        highlights: ['万卡高性能GPU算力集群', '国家级重点实验室', '学生科技创新团队大本营'],
        openingHours: '周一至周日 07:00 - 22:30'
    },
    {
        id: 'loc-003',
        name: '枫林星级学生公寓区',
        category: '生活住宿',
        images: [
            'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=800&auto=format&fit=crop'
        ],
        description: '现代化标准学生公寓，采用上床下桌设计，统一配备独立卫生间、干湿分离洗漱台、品牌冷暖变频空调、智能门禁与24小时热电供应。楼下配有自助智能洗衣房与健身休闲区。',
        terms: ['4人标准间', '独立卫浴', '冷暖空调', '上床下桌', '自助洗衣房', '门禁人脸识别', '独立阳台'],
        coordinates: { x: 72, y: 28 },
        highlights: ['上床下桌大空间', '独立卫生间与淋浴', '智能安防人脸识别', '楼下便捷超市'],
        openingHours: '门禁时间：06:00 - 23:30 (凭人脸通行)'
    },
    {
        id: 'loc-004',
        name: '中央综合体育馆与恒温游泳馆',
        category: '体育休闲',
        images: [
            'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800&auto=format&fit=crop'
        ],
        description: '综合性现代体育中心，拥有50米8泳道标准恒温游泳池、室内标准篮球馆、羽毛球与乒乓球馆、健身力量房及400米塑胶跑道田径场，是学生修完体育学分与日常锻炼的首选场所。',
        terms: ['恒温游泳馆', '室内篮球场', '健身中心', '塑胶跑道', '羽毛球馆', '体育选修课', '体测中心'],
        coordinates: { x: 78, y: 64 },
        highlights: ['国家一级标准游泳池', '专业羽毛球与木地板篮球场', '全套进口健身器材'],
        openingHours: '周一至周日 08:00 - 22:00'
    },
    {
        id: 'loc-005',
        name: '第一美食广场与云端餐厅',
        category: '餐饮美食',
        images: [
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop'
        ],
        description: '三层大型智慧体验餐厅，集合八大菜系、地方特色风味小吃、清真风味专区、精致西餐与网红咖啡厅。采用智慧盘托刷脸结算，美味营养且价格均受学校监管补贴。',
        terms: ['各地风味', '清真窗口', '网红咖啡厅', '夜宵烧烤', '智慧刷脸支付', '平价实惠', '烘焙甜品'],
        coordinates: { x: 50, y: 62 },
        highlights: ['百余种风味美食小吃', '智慧盘无感秒结算', '环境优雅宜人舒适'],
        openingHours: '早餐 06:30-09:00 | 午餐 10:30-13:30 | 晚餐 16:30-19:30 | 夜宵 20:00-22:30'
    },
    {
        id: 'loc-006',
        name: '艺术与数字媒体交互中心',
        category: '校园地标',
        images: [
            'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?q=80&w=800&auto=format&fit=crop'
        ],
        description: '学校艺术文化地标，设有一座千人多功能艺术剧场、数字媒体艺术展览馆、XR虚实融合演播厅以及艺术设计工坊。每年举办毕业设计展、高雅艺术进校园活动及迎新晚会。',
        terms: ['数字媒体', 'XR演播厅', '艺术剧场', '毕业设计展', '创意工坊', '美育基地'],
        coordinates: { x: 30, y: 72 },
        highlights: ['千人剧场舞台声光电', 'XR虚实沉浸演播室', '年度毕业设计视觉盛宴'],
        openingHours: '周二至周日 09:00 - 21:00 (周一闭馆)'
    }
];
