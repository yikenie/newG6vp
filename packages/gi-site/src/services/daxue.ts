//  初始化

data => {
  const root = data.nodes[0];
  const nodes = root.data.children.map(node => {
    return {
      id: node.id, //这里的id和data的格式还是需要用户自己处理的
      data: node,
    };
  });
  const edges = nodes.map(n => {
    return {
      source: root.id,
      target: n.id,
    };
  });
  //return data;
  return { nodes: [root, ...nodes], edges };
};

// 一度下钻

(data, params) => {
  const { id } = params;
  const matchNode = data.nodes.find(n => {
    return n.id === id;
  });
  console.log('matchnode', matchNode);

  const nodes =
    matchNode.data?.children.map(n => {
      return {
        id: n.id,
        data: n,
      };
    }) || [];

  const edges = nodes.map(n => {
    return {
      source: id,
      target: n.id,
    };
  });
  return {
    nodes,
    edges,
  };
};
