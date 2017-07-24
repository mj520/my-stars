var fs = require('fs')
var path = require('path')
var req = require('./request')
var Debug = require('debug')
var inquirer = require('inquirer')
var chalk = require('chalk')
var opn = require('opn')

const debug = Debug('star')

var page = 1
var per_page = 100
var starArray = []
var currentTotal = 100
var username = ''
var contentsList = []
var itemList = {}
var Awesome = 
`# Awesome List

> A curated list of my GitHub stars!  Generated by [my-stars](https://github.com/SirM2z/my-stars)

## Contents

`
var AwesomeContent = ''

async function main () {
  debug('获取用户名-开始')
  await getUserName()
  debug('获取用户名-结束')

  debug('获取数据-开始')
  await getStars()
  debug('获取数据-结束')

  debug('分门别类-开始')
  await sort()
  debug('分门别类-结束')

  debug('拼装内容-开始')
  build()
  debug('拼装内容-结束')

  debug('写入文件-开始')
  writeMD()
  debug('写入文件-结束')
}

// 获取用户名
async function getUserName () {
  let answers
  try {
    answers = await inquirer.prompt([{
      type: 'input',
      name: 'name',
      message: `请输入你的Github用户名`
    }])
  } catch (error) {
    throw error
  }
  username = answers.name
}
// 获取数据
async function getStars () {
  let i = 1
  while (currentTotal === per_page) {
    debug(`第${i}次获取数据-开始`)
    let data
    try {
      data = await req.get('/users/' + username + '/starred?page=' + page + '&per_page=' + per_page)
    } catch (error) {
      throw error
    }
    page++
    starArray = starArray.concat(data)
    currentTotal = data.length
    debug(`第${i}次获取数据-结束`)
    i++
  }
}
// 分门别类
async function sort () {
  for (let i = 0, len = starArray.length; i < len; i++) {
    console.log("已有分类如下：")
    console.log(chalk.green(contentsList.join(',')))
    console.log("当前项目介绍：")
    console.log(chalk.yellow('名称：') + chalk.green(starArray[i].name))
    console.log(chalk.yellow('描述：') + chalk.green(starArray[i].description))
    console.log(chalk.yellow('地址：') + chalk.green(starArray[i].html_url))
    opn(starArray[i].html_url)
    let answers
    try {
      answers = await inquirer.prompt([{
        type: 'confirm',
        name: 'islabel',
        message: `对于项目：${starArray[i].name}，是否添加新的分类？`
      }])
    } catch (error) {
      throw error
    }
    if (answers.islabel) {
      let answers
      try {
        answers = await inquirer.prompt([{
          type: 'input',
          name: 'label',
          message: `请输入对于：${starArray[i].name}，的分类？`
        }])
      } catch (error) {
        throw error
      }
      contentsList.push(answers.label)
      itemList[answers.label] = [`- [${starArray[i].name}](${starArray[i].html_url}) - ${starArray[i].description}\n`]
    } else {
      let answers
      try {
        answers = await inquirer.prompt([{
          type: 'list',
          name: 'chose',
          message: '请选择分类？',
          choices: contentsList
        }])
      } catch (error) {
        throw error
      }
      itemList[answers.chose].push(`- [${starArray[i].name}](${starArray[i].html_url}) - ${starArray[i].description}\n`)
    }
  }
}
// 拼装内容
function build () {
  for (let i = 0, len = contentsList.length; i < len; i++) {
    Awesome += `- [${contentsList[i]}](#${contentsList[i]})\n`
    let item = itemList[contentsList[i]]
    for (let j = 0, jlen = item.length; j < jlen; j++) {
      if (j === 0) {
        AwesomeContent += `## ${contentsList[i]}\n`
      }
      AwesomeContent += item[j]
    }
  }
  Awesome += AwesomeContent
}
// 写入文件
function writeMD () {
  fs.open('Awesome.md', 'w', (e, fd) => {
    if (e) throw e
    fs.write(fd, Awesome, 'utf8', (e) => {
      if (e) throw e
      fs.closeSync(fd)
    })
  })
}

main()