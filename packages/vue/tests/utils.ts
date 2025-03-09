import { defineComponent, Component, h } from 'vue'
import { mount } from '@vue/test-utils'

export function renderHook(callback: () => void, wrapper: Component) {
    const ChildComponent = defineComponent({
        setup() {
            callback?.();
        },
        render() {
            return () => h('div', {}, 'child')
        }
    })
    mount(wrapper, {
        slots: {
            default: () => h(ChildComponent)
        }
    })
}