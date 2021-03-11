
/**
 * @file   mixins 
 * @author  zhaohuajie  
 * @time     2021-01-07
 * @desc  小程序页面混入功能  
 * 
 *  合并声明周期函数，混入逻辑在前，页面在后
 *  @example  mixins:[test1,test2]   如果都有onload生命周期 ，调用顺序test1.onload=>test2.onload=>page.onload
 *  合并data数据,如果存在同名属性，后加载的混入优先级高，page中优先级最高
 *  @example   mixins:[test1,test2]    如果data中都有message属性，test2中的message 会覆盖test1中的，页面中的会覆盖test2中的
 *  合并自定义方法，如果存在同名方法，后加载的混入优先级高，page中优先级最高
 *  @example   mixins:[test1,test2]    如果data中都有message属性，test2中的message 会覆盖test1中的，页面中的会覆盖test2中的
 *   
 */

/**
 * 页面生命周期
 */
const  pageLifeTimes = {
    'onLoad' : [],
    'onShow' : [],
    'onReady' : [],
    'onHide' : [],
    'onUnload' : [],
    'onPullDownRefresh' : [],
    'onReachBottom' : [],
    'onShareAppMessage' : [],
    'onPageScroll' : [],
    'onResize' : [],
    'onTabItemTap' : [],
}

const pageProperties = {
    'data':{}
}
    
/**
 * @desc    混入
 * @param {object} options page函数原有options
 * @param {array} mixins   要混入的options
 */
function mixinOptions(options,mixins){
     //因为pageLifeTimes是纯粹的数据，所以直接使用序列化和反序列化来进行一个深拷贝
    let pageLifeTimesCopy=JSON.parse(JSON.stringify(pageLifeTimes));
    mixins.forEach((mixin) =>{
        //混入选项是否是对象
        if(!isObject(mixin)){
            throw new TypeError('mixin is not a object')
        }

        for (let [key ,vlaue] of  Object.entries(mixin)){
            //生命周期函数合并
            if(Object.keys(pageLifeTimesCopy).includes(key)){
                pageLifeTimesCopy[key].push(mixin[key])
                continue
            }

            //页面属性合并
            if(Object.keys(pageProperties).includes(key)){
                pageProperties[key] = {...pageProperties[key],...mixin[key]}
                continue
            }

            //自定义方法,页面中的优先级高
            if(!options[key]){
                options[key] =mixin[key]
            } 
        }
    })

    //混入生命周期
    for(let key  in pageLifeTimesCopy){
        let mixins=pageLifeTimesCopy[key];
        if(mixins.length>0){
            options[key] = decorator(options[key],pageLifeTimesCopy[key])
        }  
    }

    //混入页面属性
    for(let key  in pageProperties){
         options[key] = {...pageProperties[key],...options[key] }   
    }

    return options
}

/**
 * 装饰器函数
 * @params {function} fn 原函数
 * @params {desc}   装饰函数的数组
 */
function decorator(fn,desc){
    return function(){

        //页面生命周期函数存在，先执行混入生命周期函数，后执行页面生命周期函数
         let context= desc.reduce((ctx,item)=>{
            return item.apply(this,arguments)
        },{})

        if(fn&&typeof fn =='function'){
            // desc&&desc.apply(this,arguments)
            return fn.apply(this,arguments)
        }

        return context
    }
}

/**
 * 判断是否是对象
 * @param {*} obj 参数
 */

function isObject(obj){
    return Object.prototype.toString.call(obj)==='[object Object]'
}







/**
 * 替换Page函数，初始化混入
 * @param {object} config  初始化混入的配置
 * @property {object} globalMixins      全局混入对象
 */

function initMixins(config={}){
    //先存储原page函数
    const  oriPage = Page;

    //定义新的page函数
    Page = options =>{
        
        const mixins=Array.isArray(options.mixins)?options.mixins:[];
        //全局混入
        if(config.globalMixins){
            mixins.unshift(config.globalMixins)
        }
        //获取传入的混入对象数组，进行选项的合并
        if(mixins.length>0){
            options= mixinOptions(options,mixins)
        }
        oriPage(options)
    }
}
 
 

module.exports=initMixins
