class Promise {
  constructor(executor) {
    // console.log('use my Promise')
    this.PromiseState = 'padding'
    this.PromiseResult = undefined
    this.callbacks = []
    try {
      executor(this.handleResolve.bind(this), this.handleReject.bind(this))
    } catch (e) {
      this.handleReject(e)
    }
  }

  handleResolve(v) {
    if (this.PromiseState !== 'padding') return
    this.PromiseState = 'resolved'
    this.PromiseResult = v
    queueMicrotask(() => this.callbacks.forEach(item => item.onResolve.call(this)))
  }

  handleReject(e) {
    if (this.PromiseState !== 'padding') return
    this.PromiseState = 'rejected'
    this.PromiseResult = e
    queueMicrotask(() => this.callbacks.forEach(item => item.onReject.call(this)))
  }

  then(onResolve, onReject) {
    return new Promise((resolve, reject) => {
      if (typeof onResolve !== 'function') onResolve = v => v
      if (typeof onReject !== 'function') onReject = e => Promise.reject(e)
      const { PromiseState } = this
      if (PromiseState === 'resolved') {
        queueMicrotask(() => callback(onResolve))
      }
      if (PromiseState === 'rejected') {
        queueMicrotask(() => callback(onReject))
      }
      if (PromiseState === 'padding') {
        this.callbacks.push({
          onResolve() {
            callback(onResolve)
          },
          onReject() {
            callback(onReject)
          }
        })
      }
      const callback = type => {
        try {
          const result = type(this.PromiseResult)
          if (result instanceof Promise) {
            result.then(resolve, reject)
          } else {
            resolve(result)
          }
        } catch (e) {
          reject(e)
        }
      }
    })
  }

  catch(onReject) {
    return this.then(undefined, onReject)
  }

  static resolve = v =>
    new Promise((resolve, reject) => {
      if (v instanceof Promise) v.then(resolve, reject)
      else resolve(v)
    })

  static reject = e => new Promise((_, reject) => reject(e))

  static all = promises =>
    new Promise((resolve, reject) => {
      let count = 0
      let length = promises.length
      const result = []
      promises.forEach((promise, index) => {
        promise.then(
          v => {
            count++
            result[index] = v
            if (count === length) resolve(result)
          },
          e => reject(e)
        )
      })
    })

  static race = promises =>
    new Promise((resolve, reject) => {
      promises.forEach(promise => promise.then(resolve, reject))
    })
}
