import axios from 'axios'
import { stringify } from 'qs'

import getFormattedString from '../utils/date'
import { success, info, warn } from '../utils/output'
import { responsParser } from '../utils/parser'
import checker from '../utils/checker'

import LocationModel from '../model/location.model'
import UserinfoModel from '../model/userinfo.model'

type Params = {
  id: string
  id2: string
}

// 运行时的日期 作为提交的参数之一
const today = getFormattedString()

// 提交请求的响应结果
const responsMap = new Map([
  ['提交成功', 0],
  [today + '登记已存在', 1],
  ['登记失败', 2],
  ['登记失败！需开启定位功能', 3]
])

// 不带地址的一键登记
const signIn = async (url: string, params: Params): Promise<boolean> => {
  info('一键登记中...')
  const { data } = await axios.get(url, { params })
  // 解析页面返回结果
  const msg = responsParser(data)
  const res = responsMap.get(msg!)!
  const isOK = res === 0 || res === 1
  isOK ? success(msg!) : warn(msg + '无法完成一键登记，尝试常规登记...')
  return isOK
}

// 带有地址的常规登记
const signInWithLocation = async (
  url: string,
  location: LocationModel,
  params: Params
): Promise<void> => {
  info('你的地址信息如下：')
  console.log(location)
  info('常规登记中...')
  const { province, city, area } = location
  const { data } = await axios.post(
    url,
    stringify({
      province,
      city,
      area,
      wuhan: '否',
      fare: '否',
      wls: '否',
      kesou: '否',
      zhengduan: '',
      Submit: '提交',
      action: 'add',
      adds: 'undefined',
      addsxy: 'undefined'
    }),
    { params }
  )

  // 解析页面返回结果
  const msg = responsParser(data)
  const res = responsMap.get(msg!)!
  checker(res === 0 || res === 1, msg, new Error('常规登记出错'))
}

const submitRequest = async (
  isFirstExec: boolean,
  userinfo: UserinfoModel,
  id: string,
  ...urls: Array<string>
): Promise<void> => {
  // 一键登记的地址、常规登记的地址
  const [url, generalUrl] = urls
  const { province, city, area } = userinfo
  const location = { province, city, area } as LocationModel
  // 两种登记方式都需要携带的 params 参数
  const params: Params = { id, id2: today }
  info(`尝试提交${today}的打卡申请...`)
  // 是第一次执行进行常规登记，否则一键登记，一键登记失败则常规登记
  !isFirstExec && await signIn(url, params) || await signInWithLocation(generalUrl, location, params)
}

export default submitRequest
