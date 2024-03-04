(() => {
  const deploymentId = 'f42a9541-bc98-4f96-81b2-a80846a519f4'
  const iframe = 'https://nr-customers.s3.amazonaws.com/PS/ajmila/ATOS%20NSANDI/CX/iframe.html'

  const storageToMonitor = [
    '_actmu',
    '_actms',
    '_actts',
    `_${deploymentId}:gcmcopn`,
    `_${deploymentId}:gcmcsessionActive`
  ]

  const iFrameURL = new URL(iframe) // was this necessary?

  const backup = {} // will store all the keys

  const ifrm = document.createElement('iframe')
  ifrm.setAttribute('src', iframe)
  ifrm.setAttribute('id', 'CXJAR')
  ifrm.setAttribute('title', 'CXJARtitle')
  ifrm.style.width = '0px'
  ifrm.style.height = '0px'
  ifrm.style.display = 'none'
  ifrm.frameBorder = 0
  document.body.appendChild(ifrm)

  ifrm.onload = function () {
    console.log('WINDOW: Checking if iframe connects...')
    sendMessage('check')
  }

  function sendMessage (type, content) {
    const ct = window.frames.CXJAR
    if (!(ct && type)) return
    const message = JSON.stringify({ type, content })
    ct.contentWindow.postMessage(message, iFrameURL.origin)
  }

  window.addEventListener(
    'message',
    function (event) {
      if (event.origin !== iFrameURL.origin) return
      // console.log('[[[WINDOW]]]: Message was allowed')
      const message = JSON.parse(event.data)
      if (message.type) {
        // console.log('[[[WINDOW]]]: Received message: ', JSON.stringify(message))

        if (message.type === 'ok') {
          console.log(
            'WINDOW: Round trip completed, connection successful with Iframe'
          )
          function checkStorage () {
            storageToMonitor.forEach(function (space) {
              sendMessage('get', space)
            })
          }
          checkStorage()
          window.setInterval(checkStorage, 2000)
          window.setTimeout(init, 500)
        }

        if (message.type === 'response' && message.content) {
          // console.log('Key received: ' + message.content[0])
          if (message.content[1] !== backup[message.content[0]]) {
            console.log('Change from network iframe')
            if (message.content[1]) {
              window.localStorage.setItem(
                message.content[0],
                message.content[1]
              )
            } else window.localStorage.removeItem(message.content[0])
            backup[message.content[0]] = message.content[1]
          } else {
            const fromLS = window.localStorage.getItem(message.content[0]) || ''
            if (fromLS !== backup[message.content[0]]) {
              console.log('Change from local, sending the iframe')
              sendMessage('set', [message.content[0], fromLS])
              backup[message.content[0]] = fromLS
            }
          }
        }
      }
    },
    false
  )

  function init () {
    (function (g, e, n, es, ys) {
      g._genesysJs = e
      g[e] =
          g[e] ||
          function () {
            ;(g[e].q = g[e].q || []).push(arguments)
          }
      g[e].t = 1 * new Date()
      g[e].c = es
      ys = document.createElement('script')
      ys.async = 1
      ys.src = n
      ys.charset = 'utf-8'
      document.head.appendChild(ys)
    })(
      window,
      'Genesys',
      'https://apps.euw2.pure.cloud/genesys-bootstrap/genesys.min.js',
      {
        environment: 'prod-euw2',
        deploymentId
      }
    )
  }
})()
