import React, { Component } from 'react'
import { string } from 'prop-types'
import {
  CommentIcon,
  CheckIcon,
  RepoForkedIcon,
  EyeIcon,
  ChecklistIcon,
  CloudUploadIcon,
  GlobeIcon,
  HubotIcon,
  MilestoneIcon,
  ProjectIcon,
  StopIcon,
  NoteIcon,
  RepoPushIcon,
  PackageIcon,
  GitPullRequestIcon,
  BookmarkIcon,
  IssueOpenedIcon,
  IssueClosedIcon
} from 'react-octicons'

const iconMap = {
  push: <RepoPushIcon />,
  pull_request: <GitPullRequestIcon />,
  label: <BookmarkIcon />,
  'issues.opened': <IssueOpenedIcon />,
  'issues.closed': <IssueClosedIcon />,
  issue_comment: <CommentIcon />,
  status: <CheckIcon />,
  fork: <RepoForkedIcon />,
  watch: <EyeIcon />,
  check_run: <ChecklistIcon />,
  check_suite: <ChecklistIcon />,
  deployment: <CloudUploadIcon />,
  deployment_status: <CloudUploadIcon />,
  ping: <GlobeIcon />,
  installation: <HubotIcon />,
  installation_repositories: <HubotIcon />,
  milestone: <MilestoneIcon />,
  project: <ProjectIcon />,
  project_card: <NoteIcon />,
  project_column: <ProjectIcon />,
  repository_vulnerability_alert: <StopIcon />
}

export default class EventIcon extends Component {
  static propTypes = {
    action: string,
    event: string.isRequired
  }

  render () {
    const { action, event } = this.props
    let icon

    if (action && iconMap[`${event}.${action}`]) {
      icon = iconMap[`${event}.${action}`]
    } else if (iconMap[event]) {
      icon = iconMap[event]
    } else {
      icon = <PackageIcon />
    }

    return icon
  }
}
