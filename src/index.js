const storeKey = '$store'
const subscriptionKey = '$storeSubscription'

// ------------------------------------------------------------------------
// STORE CONFIGURATION
// ------------------------------------------------------------------------
Vue.use(Vuex)

const mutationTypes = {
  INCREMENT: 'INCREMENT',
  INCREMENT_START: 'INCREMENT_START',
  INCREMENT_STOP: 'INCREMENT_STOP'
}
const actionTypes = {
  INCREMENT_ASYNC: 'INCREMENT_ASYNC'
}
const mutations = {
  increment: (value = 1) => ({
    type: mutationTypes.INCREMENT,
    value: value
  })
}
const actions = {
  incrementAsync: (value = 1) => ({
    type: actionTypes.INCREMENT_ASYNC,
    value: value
  })
}

const store = new Vuex.Store({
  state: {
    count: 0,
    isIncrementing: false
  },
  getters: {
    countGreaterThan2: (state, getters) => state.count > 2
  },
  mutations: {
    [mutationTypes.INCREMENT](state) {
      state.count++
    },
    [mutationTypes.INCREMENT_START](state) {
      state.isIncrementing = true
    },
    [mutationTypes.INCREMENT_STOP](state) {
      state.isIncrementing = false
    }
  },
  actions: {
    [actionTypes.INCREMENT_ASYNC]({ commit, state }, payload) {
      commit(mutationTypes.INCREMENT_START)
      return new Promise(resolve => {
        setTimeout(() => {
          commit(mutationTypes.INCREMENT)
          resolve()
        }, 500)
      }).then(() => commit(mutationTypes.INCREMENT_STOP))
        .then(() => state.count)
    }
  },
  modules: {
    mod1: {
      namespaced: true,
      state: {
        count: 1000,
        isIncrementing: false
      },
      getters: {
        countGreaterThan1002: (state, getters) => state.count > 1002
      },
      mutations: {
        increment(state) {
          state.count++
        },
        incrementStart(state) {
          state.isIncrementing = true
        },
        incrementStop(state) {
          state.isIncrementing = false
        }
      },
      actions: {
        incrementAsync({ commit, state }) {
          commit('incrementStart')
          return new Promise(resolve => {
            setTimeout(() => {
              commit('increment')
              resolve()
            }, 500)
          }).then(() => commit('incrementStop'))
            .then(() => state.count)
        }
      }
    }
  }
})
// ------------------------------------------------------------------------
// ------------------------------------------------------------------------


// ------------------------------------------------------------------------
// PROVIDER COMPONENT
// ------------------------------------------------------------------------
const createProvider = () => {
  class Provider extends React.Component {
    getChildContext() {
      return {
        [storeKey]: this[storeKey],
        [subscriptionKey]: null
      }
    }

    constructor(props, context) {
      super(props, context)
      this[storeKey] = props.store;
    }

    render() {
      return React.Children.only(this.props.children)
    }
  }

  // if (process.env.NODE_ENV !== 'production') {
  //   Provider.prototype.componentWillReceiveProps = function (nextProps) {
  //     if (this[storeKey] !== nextProps.store) {
  //       warnAboutReceivingStore()
  //     }
  //   }
  // }

  Provider.propTypes = {
    store: PropTypes.object.isRequired,
    children: PropTypes.element.isRequired,
  }
  Provider.childContextTypes = {
    [storeKey]: PropTypes.object.isRequired,
    [subscriptionKey]: PropTypes.object,
  }

  return Provider
}
// ------------------------------------------------------------------------
// ------------------------------------------------------------------------

const Provider = createProvider()

// store.subscribe((mutation, state) => {
//   console.log(mutation, {...state})
// })

// ------------------------------------------------------------------------
// CHILD1 COMPONENT
// ------------------------------------------------------------------------
class Child1 extends React.PureComponent {
  constructor(props, context) {
    super(props, context)
    this.handleInc = this.handleInc.bind(this)
    this.handleIncAsync = this.handleIncAsync.bind(this)
  }
  handleInc() {
    this.props.onIncrement && this.props.onIncrement()
  }
  handleIncAsync() {
    this.props.onIncrementAsync && this.props.onIncrementAsync().then(console.log)
  }
  render() {
    return (
      <div>
        I am a Child1
        {this.props.test && ` with props test = ${this.props.test}`},
        count is {this.props.myCount !== undefined && `${this.props.myCount}, `}
        greater than {this.props.limitCount || 2}: {this.props.isGreaterThan2 ? 'yes' : 'no'}
        {this.props.onIncrement &&
          <button onClick={this.handleInc}>Test</button>
        }
        {this.props.onIncrementAsync &&
          <button onClick={this.handleIncAsync}>Test async</button>
        }
        {this.props.children}
      </div>
    )
  }
}
// ------------------------------------------------------------------------
// ------------------------------------------------------------------------


// ------------------------------------------------------------------------
// COMPARING OBJECTS
// ------------------------------------------------------------------------
const hasOwn = Object.prototype.hasOwnProperty

const is = (x, y) => {
  if (x === y) {
    return x !== 0 || y !== 0 || 1 / x === 1 / y
  } else {
    return x !== x && y !== y
  }
}

const shallowEqual = (objA, objB) => {
  if (is(objA, objB)) {
    return true
  }
  if (typeof objA !== 'object' || objA === null ||
    typeof objB !== 'object' || objB === null) {
    return false
  }
  const keysA = Object.keys(objA)
  const keysB = Object.keys(objB)
  if (keysA.length !== keysB.length) {
    return false
  }
  for (let i = 0; i < keysA.length; i++) {
    if (!hasOwn.call(objB, keysA[i]) ||
      !is(objA[keysA[i]], objB[keysA[i]])) {
      return false
    }
  }
  return true
}
// ------------------------------------------------------------------------
// ------------------------------------------------------------------------


// ------------------------------------------------------------------------
// PRESENTATIONAL COMPONENT
// ------------------------------------------------------------------------
const connect = (
  mapStateToPropsFn,
  mapDispatchToPropsFn,
  mapCommitToPropsFn,
  mapGetterToPropsFn
) => (Component) => {
  class PresentationalComponent extends Component {
    constructor(props, context) {
      super(props, context)
      this.store = props[storeKey] || context[storeKey]
      this.subscription = props[subscriptionKey] || context[subscriptionKey]
      this.mappedState = mapStateToPropsFn && mapStateToPropsFn(this.store.state, props)
      this.mappedGetters = mapGetterToPropsFn && mapGetterToPropsFn(this.store.getters, props)
      this.state = Object.assign(
        {},
        this.mappedState,
        mapDispatchToPropsFn && mapDispatchToPropsFn(this.store.dispatch, props),
        mapCommitToPropsFn && mapCommitToPropsFn(this.store.commit, props),
        this.mappedGetters
      )
      const propsKeysArray = Object.keys(this.mappedState)
      this.mappedState && store.subscribe((mutation, state, aaa) => {
        let newState = {}
        // update state from store state
        const newMappedState = mapStateToPropsFn(state)
        if (!shallowEqual(this.mappedState, newMappedState)) {
          this.mappedState = newMappedState
          newState = Object.assign({}, newState, this.mappedState)
        }

        // update state from store getters
        const newMappedGetters = mapGetterToPropsFn(this.store.getters)
        if (!shallowEqual(this.mappedGetters, newMappedGetters)) {
          this.mappedGetters = newMappedGetters
          newState = Object.assign({}, newState, this.mappedGetters)
        }

        if (Object.keys(newState).length) {
          this.setState(newState)
        }
      })
    }

    componentDidUpdate() {
      console.log('componentDidUpdate')
    }

    getChildContext() {
      return {
        [subscriptionKey]: this.subscription
      }
    }

    render() {
      return React.createElement(Component, Object.assign({}, this.props, this.state), this.props.children)
    }
  }
  PresentationalComponent.childContextTypes = {
    [subscriptionKey]: PropTypes.object,
  }
  PresentationalComponent.contextTypes = {
    [storeKey]: PropTypes.object,
    [subscriptionKey]: PropTypes.object,
  }
  PresentationalComponent.propTypes = {
    [storeKey]: PropTypes.object,
    [subscriptionKey]: PropTypes.object,
  }
  return PresentationalComponent
}
// ------------------------------------------------------------------------
// ------------------------------------------------------------------------


const mapStateToProps = (state, ownProps) => ({
  myCount: state.count
})
const mapDispatchToProps = (dispatch, ownProps) => ({
  onIncrementAsync: (val) => dispatch(actions.incrementAsync(val))
})
const mapCommitToProps = (commit, ownProps) => ({
  onIncrement: () => commit(mutations.increment())
})
const mapGetterToProps = (getter, ownProps) => ({
  isGreaterThan2: getter.countGreaterThan2
})
const VisibleChild1 = connect(
  mapStateToProps,
  mapDispatchToProps,
  mapCommitToProps,
  mapGetterToProps
)(Child1)


const mapGetterToProps2 = (getter, ownProps) => ({
  isGreaterThan2: getter.countGreaterThan2
})
const VisibleChild2 = connect(
  () => ({}),
  () => ({}),
  () => ({}),
  mapGetterToProps2
)(Child1)


const mapStateToProps3 = (state, ownProps) => ({
  limitCount: 1002,
  myCount: state.mod1.count
})
const mapDispatchToProps3 = (dispatch, ownProps) => ({
  onIncrementAsync: (val) => dispatch('mod1/incrementAsync')
})
const mapCommitToProps3 = (commit, ownProps) => ({
  onIncrement: () => commit('mod1/increment')
})
const mapGetterToProps3 = (getter, ownProps) => ({
  isGreaterThan2: getter['mod1/countGreaterThan1002']
})
const VisibleChild3 = connect(
  mapStateToProps3,
  mapDispatchToProps3,
  mapCommitToProps3,
  mapGetterToProps3
)(Child1)


class Main extends React.PureComponent {
  constructor(props, context) {
    super(props, context)
    this.state = {
      testValue: 123
    }
  }

  render() {
    setTimeout(() => {
      this.setState({
        testValue: this.state.testValue + 333
      })
    }, 2000);
    return (
      <div>
        <VisibleChild1 />
        <VisibleChild2 />
        <VisibleChild3 />
        <VisibleChild3 test={this.state.testValue}>
          <p>&nbsp;&nbsp;- Great job!</p>
        </VisibleChild3>
      </div>
    )
  }
}
class Welcome extends React.Component {
  render() {
    return (
      <div>
        <h1>Hello, {this.props.name}!</h1>
        <Provider store={store}>
          <Main />
        </Provider>
      </div>
    )
  }
}

ReactDOM.render(
  <div>
    <h1>Hello, world!</h1>
    <Welcome name="folks" />
  </div>,
  document.getElementById('root')
);
