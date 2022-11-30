import { message } from 'antd';
import localforage from 'localforage';
import request from 'umi-request';
import { getUid } from '../pages/Workspace/utils';
import { ASSET_TYPE, IS_INDEXEDDB_MODE, SERVICE_URL_PREFIX } from './const';
import { IProject } from './typing';

export function getEdgesByNodes(nodes, edges) {
  const ids = nodes.map(node => node.id);
  return edges.filter(edge => {
    const { source, target } = edge;
    if (ids.indexOf(source) !== -1 && ids.indexOf(target) !== -1) {
      return true;
    }
    return false;
  });
}

/**
 * 获取指定项目
 * @param id 项目id
 * @returns
 */
export const getProjectById = async (id: string): Promise<IProject | undefined> => {
  const trans = project => {
    return {
      engineId: project.engineId || 'GI', // 兼容过去的版本
      engineContext: project.engineContext || {
        // 兼容过去的版本
        schemaData: project.schemaData,
        data: project.data.transData,
      },
      schemaData: project.schemaData,
      config: project.projectConfig,
      data: project.data,
      activeAssetsKeys: project.activeAssetsKeys,
      name: project.name,
      type: project.type,
    };
  };
  if (IS_INDEXEDDB_MODE) {
    const project: any = await localforage.getItem(id);
    if (!project) {
      message.info('请先在「工作台」页面选择环境...');
      //可能是用户第一进来的时候，没有选择环境
      window.location.href = window.location.origin;
    }

    return trans(project);
  }

  const response = await request(`${SERVICE_URL_PREFIX}/project/${id}`, {
    method: 'get',
  });
  if (response.success) {
    return trans(response.data);
  }
};

/**
 * 更新或保存指定项目
 * @param id 项目id
 * @param p 项目配置
 * @returns
 */
export const updateProjectById = async (
  id: string,
  params: { data?: string; [key: string]: any },
): Promise<IProject> => {
  if (IS_INDEXEDDB_MODE) {
    const origin: any = await localforage.getItem(id);
    const {
      data,
      serviceConfig,
      projectConfig,
      name,
      activeAssetsKeys,
      schemaData,
      expandInfo,
      type,
      engineId,
      engineContext,
    } = params;
    // 为了兼容OB的存储，仅为string，因此所有传入的数据格式都是string，但是本地IndexDB存储的是object
    // 未来也可以改造为出入params为对象，给到OB的借口全部JSON.stringify
    if (engineId) {
      origin.engineId = engineId;
    }
    if (engineContext) {
      origin.engineContext = engineContext;
    }
    if (data) {
      origin.data = data;
    }
    if (serviceConfig) {
      origin.serviceConfig = serviceConfig;
    }
    if (projectConfig) {
      origin.projectConfig = projectConfig;
    }
    if (schemaData) {
      origin.schemaData = schemaData;
    }

    if (activeAssetsKeys) {
      origin.activeAssetsKeys = activeAssetsKeys;
    }
    if (name) {
      origin.name = name;
    }

    if (expandInfo) {
      origin.expandInfo = expandInfo;
    }

    /* if (type) {
      origin.type = type;
    } */
    return await localforage.setItem(id, origin);
  }

  params.id = id;

  const response = await request(`${SERVICE_URL_PREFIX}/project/update`, {
    method: 'post',
    data: params,
  });

  return response.success;
};

// 软删除项目
export const removeProjectById = async (id: string) => {
  if (IS_INDEXEDDB_MODE) {
    return await localforage.removeItem(id);
  }

  const response = await request(`${SERVICE_URL_PREFIX}/project/delete`, {
    method: 'post',
    data: {
      id,
    },
  });

  return response.success;
};

/**
 * 获取所有项目
 * @returns
 */
export const getProjectList = async (type: 'project' | 'case' | 'save'): Promise<IProject[]> => {
  if (IS_INDEXEDDB_MODE) {
    const projects: IProject[] = [];
    const cases: IProject[] = [];
    const save: IProject[] = [];

    const iter = await localforage.iterate((value: IProject) => {
      if (value.type === 'case') {
        cases.push(value);
      }
      if (value.type === 'save') {
        //@ts-ignore
        const { id, type, params } = value;
        save.push({
          id,
          type,
          ...JSON.parse(params),
        });
      }
      if (value.type === 'project') {
        projects.push(value);
      }
    });
    if (type === 'project') {
      projects.sort((a, b) => {
        return a.gmtCreate - b.gmtCreate;
      });
      return projects;
    }
    if (type == 'case') {
      console.log('case:', cases);
      return cases;
    }
    if (type == 'save') {
      return save;
    }
  }

  const response = await request(`${SERVICE_URL_PREFIX}/project/list`, {
    method: 'post',
  });

  if (response.success) {
    return response.data;
  }
  return [];
};

/**
 * 增加项目
 */
export const addProject = async (param: any): Promise<string | undefined> => {
  const projectId = getUid();
  const { engineContext, ...otherParams } = param;

  const p = {
    ...otherParams,
    engineContext: engineContext || {},
    id: projectId,
    isProject: true,
    gmtCreate: new Date(),
  };
  if (IS_INDEXEDDB_MODE) {
    localforage.setItem(projectId, p);
    return new Promise(resolve => {
      resolve(projectId);
    });
  }
  const response = await request(`${SERVICE_URL_PREFIX}/project/create`, {
    method: 'post',
    data: param,
  });

  if (response.success && response.data?.insertId) {
    return response.data?.insertId;
  }
};

/**
 * 收藏项目
 * @returns
 */
export const starProject = async (param: any) => {
  const response = await request(`${SERVICE_URL_PREFIX}/favorite/add`, {
    method: 'post',
    data: param,
  });

  if (response.success) {
    return response.data;
  }
  return [];
};

/**
 * 收藏项目列表
 * @returns
 */
export const getFavoriteList = async () => {
  const response = await request(`${SERVICE_URL_PREFIX}/favorite/get`, {
    method: 'post',
    data: { assetType: ASSET_TYPE.PROJECT },
  });

  if (response.success) {
    return response.data;
  }
  return [];
};
