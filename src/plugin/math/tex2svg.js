/*************************************************************************
 *
 *  component/tex2svg
 *
 *  Uses MathJax v3 to convert a TeX string to an SVG string.
 *
 * ----------------------------------------------------------------------
 *
 *  Copyright (c) 2019 The MathJax Consortium
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

const argv = {
  packages: 'base, autoload, require, ams, newcommand',
  fontCache: true,
  dist: true,
}

// 这里不能用 let/const
/* global MathJax */
// eslint-disable-next-line no-global-assign
MathJax = {
  options: {
    enableAssistiveMml: argv.assistiveMml
  },
  loader: {
    paths: { mathjax: 'mathjax-full/es5' },
    source: (argv.dist ? {} : require('mathjax-full/components/src/source.js').source),
    require,
    load: ['adaptors/liteDOM']
  },
  tex: {
    packages: argv.packages.split(/\s*,\s*/)
  },
  svg: {
    fontCache: (argv.fontCache ? 'local' : 'none')
  },
  startup: {
    typeset: false
  }
}

//  Load the MathJax startup module
require('mathjax-full/' + (argv.dist ? 'es5' : 'components/src/tex-svg') + '/tex-svg.js')

const config = {
  display: true, // false 为行间公式
  em: 32,
  ex: 16,
  containerWidth: 80 * 16,
  ...require('../../config').tex
}

const svgReplace = [
  // phantomjs 的 svg 背景色默认为透明, 这里改为白色
  [/(style="[^"]*)"/, '$1; background-color: white"'],
  // 加白边, 例如 viewBox="-100 -983.9 5492.7 1188.9"
  [/viewBox="([^"]*)"/, (match, $1) => {
    const viewBox = $1.split(' ')
      .map(parseFloat)
      .map((x, i) => i < 2 ? x - 100 : x + 200)
      .join(' ')
    return `viewBox="${viewBox}"`
  }],
  // line 加粗
  [/(<line [^>]*class="mjx-solid")/g, '$1 style="stroke-width:50"'],
  // 报错文字背景色
  ['data-background="true"', 'fill="#fff"'],
  // & 转义
  [/&(?![#a-z0-9])/g, '&amp;'],
]

// Wait for MathJax to start up
MathJax.startup.promise.then(() => {
  console.log('mathjax started')
})

module.exports = async function tex2svg (formula) {
  const node = await MathJax.tex2svgPromise(formula, config)
  let svg = await MathJax.startup.adaptor.innerHTML(node)

  // 宽高单位从 ex 改为 px
  const widthReg = /width="[^e]*ex"/
  const widthMatch = svg.match(widthReg)
  let width
  if (widthMatch) {
    width = parseFloat(widthMatch[0].slice(7)) * config.ex
    svg = svg.replace(widthReg, `width="${width}"`)
  }

  const heightReg = /height="[^e]*ex"/
  const heightMatch = svg.match(heightReg)
  let height
  if (heightMatch) {
    height = parseFloat(heightMatch[0].slice(8)) * config.ex
    svg = svg.replace(heightReg, `height="${height}"`)
  }

  // 收集错误信息
  const errorReg = /data-mjx-error="([^"]*)"/
  const errorMatch = svg.match(errorReg)
  const error = errorMatch && errorMatch[1]

  // 其他正则替换
  svgReplace.forEach(arg => svg = svg.replace(...arg))

  return { svg, width, height, error }
}
