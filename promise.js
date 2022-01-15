const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";
function LocalPromise(executor) {
  this.state = PENDING;
  this.value = null;
  this.reason = null;
  this.onFulfilledCB = [];
  this.onRejectedCB = [];

  this.resolve = function (value) {
    if (this.state === PENDING) {
      this.state = FULFILLED;
      this.value = value;

      if (this.onFulfilledCB.length > 0) {
        this.onFulfilledCB.forEach((onFulfilled) => {
          setTimeout(() => {
            onFulfilled(this.value);
          }, 0);
        });
      }
    }
  };

  this.reject = function (reason) {
    if (this.state === PENDING) {
      this.state = REJECTED;
      this.reason = reason;

      if (this.onRejectedCB.length > 0) {
        this.onRejectedCB.forEach((onRejected) => {
          setTimeout(() => {
            onRejected(this.reason);
          }, 0);
        });
      }
    }
  };

  executor(this.resolve.bind(this), this.reject.bind(this));
}

function resolvePromise(promise, x, resolve, reject) {
  if (x === promise) {
    return reject(
      new TypeError("The promise and the return value are the same")
    );
  }
  if (x instanceof LocalPromise) {
    x.then((value) => {
      resolvePromise(promise, value, resolve, reject);
    }, reject);
  } else if (typeof x === "object" || typeof x === "function") {
    if (x === null) {
      return resolve(x);
    }

    let then;
    try {
      then = x.then;
    } catch (e) {
      return reject(error);
    }

    if (typeof then === "function") {
      let called = false;
      try {
        then.call(
          x,
          function (value) {
            if (called) return;
            called = true;

            resolvePromise(promise, value, resolve, reject);
          },
          function (reason) {
            if (called) return;
            called = true;

            reject(reason);
          }
        );
      } catch (e) {
        if (called) {
          return;
        }

        reject(e);
      }
    } else {
      resolve(x);
    }
  } else {
    resolve(x);
  }
}
LocalPromise.prototype.then = function (
  potential_onFulfilled,
  potential_onRejected
) {
  const onFulfilled =
    (typeof potential_onFulfilled === "function" && potential_onFulfilled) ||
    ((value) => value);
  const onRejected =
    (typeof potential_onRejected === "function" && potential_onRejected) ||
    ((reason) => {
      if (reason instanceof Error) {
        throw reason;
      } else {
        throw new Error(reason);
      }
    });
  const nextPromise = new LocalPromise((resolve, reject) => {
    if (this.state === FULFILLED) {
      setTimeout(() => {
        try {
          const x = onFulfilled(this.value);
          resolvePromise(nextPromise, x, resolve, reject);
        } catch (e) {
          reject(e);
        }
      }, 0);
    } else if (this.state === REJECTED) {
      setTimeout(() => {
        try {
          const x = onRejected(this.reason);
          reject(x);
        } catch (e) {
          reject(e);
        }
      }, 0);
    } else {
      this.onFulfilledCB.push((value) => {
        setTimeout(() => {
          try {
            const x = onFulfilled(value);
            resolvePromise(nextPromise, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        }, 0);
      });
      this.onRejectedCB.push((reason) => {
        try {
          const x = onRejected(reason);
          reject(x);
        } catch (e) {
          reject(e);
        }
      });
    }
  });

  return nextPromise;
};

console.log("start");
new LocalPromise((resolve, reject) => {
  setTimeout(() => {
    resolve("hello world");
  }, 2000);
})
  .then((value) => {
    console.log(value);
  })
  .then((value) => {
    return new LocalPromise((resolve) => {
      setTimeout(() => {
        resolve("hello rabbit");
      }, 2000);
    });
  })
  .then((value) => {
    console.log(value);
  });

console.log("main end");
