function emitNewMessage(io, { phone, direction, body }) {
    io.emit("new_message", {
      phone,
      direction,
      body,
      timestamp: new Date(),
    });
  }
  
  function emitCustomerUpdate(io, customer) {
    io.emit("update_customer", customer); // puedes mandar info extra si quieres
  }
  
  module.exports = {
    emitNewMessage,
    emitCustomerUpdate,
  };