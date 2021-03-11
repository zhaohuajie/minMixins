const  globalMixins={
  onLoad:function(){
    globalMixins:'success'
    console.log('我是全局的混入',this.data.globalMixins)
  },
  data:{
    globalMixins:'success'
  }
}


module.exports= globalMixins
