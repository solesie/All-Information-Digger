import { render } from 'preact'
import '../base.css'
import { getUserConfig, Language, Theme } from '../config'
import { detectSystemColorScheme } from '../utils'
import ChatGPTContainer from './ChatGPTContainer'
import { config, SearchEngine } from './search-engine-configs'
import './styles.scss'
import { getPossibleElementByQuerySelector } from './utils'

async function mount(question: string, searchItems: any[], siteConfig: SearchEngine) {
  const container = document.createElement('div')
  container.className = 'chat-gpt-container'

  const userConfig = await getUserConfig()
  let theme: Theme
  if (userConfig.theme === Theme.Auto) {
    theme = detectSystemColorScheme()
  } else {
    theme = userConfig.theme
  }
  if (theme === Theme.Dark) {
    container.classList.add('gpt-dark')
  } else {
    container.classList.add('gpt-light')
  }

  const siderbarContainer = getPossibleElementByQuerySelector(siteConfig.sidebarContainerQuery)
  if (siderbarContainer) {
    siderbarContainer.prepend(container)
  } else {
    container.classList.add('sidebar-free')
    const appendContainer = getPossibleElementByQuerySelector(siteConfig.appendContainerQuery)
    if (appendContainer) {
      appendContainer.appendChild(container)
    }
  }

  render(
    <ChatGPTContainer
      question={question}
      searchItems={searchItems}
      triggerMode={userConfig.triggerMode || 'always'}
    />,
    container,
  )
}

const siteRegex = new RegExp(Object.keys(config).join('|'))
const siteName = location.hostname.match(siteRegex)![0]
const siteConfig = config[siteName]

async function run() {
  const searchInput = getPossibleElementByQuerySelector<HTMLInputElement>(siteConfig.inputQuery)
  if (searchInput && searchInput.value) {
    console.debug('Mount ChatGPT on', siteName)
    const userConfig = await getUserConfig()
    const searchValueWithLanguageOption =
      userConfig.language === Language.Auto
        ? searchInput.value
        : `${searchInput.value}(in ${userConfig.language})`

    const items = Array.from(document.querySelectorAll('h3'))
      .filter((x) => !!x.getAttribute('class'))
      .slice(0, 5)
      .map((x) => {
        const link = x?.parentNode?.getAttribute('href')

        let langNode = x

        while (!langNode.getAttribute('lang') && langNode.parentNode != null) {
          langNode = langNode.parentNode
        }

        return {
          title: x.innerText,
          href: link,
          description: langNode?.children?.[0]?.children?.[1]?.innerText,
        }
      })

    mount(searchValueWithLanguageOption, items, siteConfig)
  }
}

run()

if (siteConfig.watchRouteChange) {
  siteConfig.watchRouteChange(run)
}
