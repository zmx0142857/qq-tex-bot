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


const PACKAGES = 'base, autoload, require, ams, newcommand';

const argv = {
  packages: PACKAGES,
  fontCache: true,
  dist: true,
}

// 这里不能用 let/const
MathJax = {
  options: {
    enableAssistiveMml: argv.assistiveMml
  },
  loader: {
    paths: {mathjax: 'mathjax-full/es5'},
    source: (argv.dist ? {} : require('mathjax-full/components/src/source.js').source),
    require: require,
    load: ['adaptors/liteDOM']
  },
  tex: {
    packages: argv.packages.replace('\*', PACKAGES).split(/\s*,\s*/)
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
  em: 16,
  ex: 8,
  containerWidth: 80 * 16,
}

// Wait for MathJax to start up
MathJax.startup.promise.then(() => {
  console.log('mathjax started')
})

module.exports = function tex2svg (formula) {
  return MathJax.tex2svgPromise(formula, config).then(node =>
    MathJax.startup.adaptor.innerHTML(node)
  )
  // svg 的宽高单位从 ex 改为 px
  .then(svg => {
    const w = /width="[^e]*ex"/
    const h = /height="[^e]*ex"/
    const width = parseFloat(svg.match(w)[0].slice(7)) * config.ex * 2
    const height = parseFloat(svg.match(h)[0].slice(8)) * config.ex * 2
    //console.log(width, height)
    return svg.replace(w, `width="${width}"`)
      .replace(h, `height="${height}"`)
      .replace('data-background="true"', 'fill="#fff"')
  })
  .catch(() => {
    throw new Error('公式格式有误')
  })
}
