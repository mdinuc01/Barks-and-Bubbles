class idUtil {

  generateUniqueId(type) {
    const timestamp = new Date().toLocaleString();
    const random = Math.random().toString(36).substring(2, 17);
    return `${type}_${timestamp}_${random}`
      .replaceAll('/', '_')
      .replaceAll(', ', '_')
      .replaceAll(' ', '_')
      .replaceAll(' PM', '_PM')
      .replaceAll(' AM', '_AM')
      .replaceAll("_", "")
      .replaceAll("-", "")
      .replaceAll(":", "")
      .replaceAll(".", "");
  }
}

module.exports = new idUtil();