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

// Wait for MathJax to start up
MathJax.startup.promise.then(() => {
  console.log('mathjax started')
})

module.exports = function tex2svg (formula) {
  return MathJax.tex2svgPromise(formula, config).then(node =>
    MathJax.startup.adaptor.innerHTML(node)
  )
    .then(svg => {
    // 宽高单位从 ex 改为 px
      const w = /width="[^e]*ex"/
      const h = /height="[^e]*ex"/
      const width = parseFloat(svg.match(w)[0].slice(7)) * config.ex
      const height = parseFloat(svg.match(h)[0].slice(8)) * config.ex

      // 增加背景色
      const backgroundColor = 'white'
      const style = /style="[^"]*"/
      const originalStyle = svg.match(style)[0]
      const styleWithBackgroundColor = originalStyle.slice(0, -1) + `; background-color: ${backgroundColor}` + '"'

      // console.log(svg.match(style))
      // console.log(width, height)

      // 加白边
      // viewBox="-100 -983.9 5492.7 1188.9"
      const v = /viewBox="([^"]*)"/
      const matchV = svg.match(v)
      if (matchV) {
        const viewBox = matchV[1].split(' ')
          .map(parseFloat)
          .map((x, i) => i < 2 ? x - 100 : x + 200)
          .join(' ')
        svg = svg.replace(v, `viewBox="${viewBox}"`)
      }

      const matchError = svg.match(/data-mjx-error="([^"]*)"/)

      svg = svg.replace(w, `width="${width}"`) // 设置宽高
        .replace(h, `height="${height}"`)
        .replace('data-background="true"', 'fill="#fff"') // 为报错文字设置背景色
        .replace(style, styleWithBackgroundColor) // 为 phantomjs 的 svg 设置背景
        .replace(/&(?![#a-z0-9])/g, '&amp;') // & 转义

      return {
        width,
        height,
        svg,
        error: matchError && matchError[1],
      }
    })
}
