const app = getApp()
import {test,test2} from "../mixins/test"
Page({
  mixins:[test,test2],
  data: {
    name:'页面中优先级高'
  },
  onLoad() {
    console.log(this.data)
    this.initData()
  },
})
